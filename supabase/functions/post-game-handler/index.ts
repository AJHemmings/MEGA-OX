// supabase/functions/post-game-handler/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_LEVEL = 250
const MIN_MOVES = 5

function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5))
}

function cumulativeXPToLevel(targetLevel: number): number {
  let total = 0
  for (let l = 1; l < targetLevel; l++) total += xpForLevel(l)
  return total
}

function levelFromXP(totalXP: number): number {
  let level = 1
  while (level < MAX_LEVEL) {
    if (totalXP < cumulativeXPToLevel(level + 1)) break
    level++
  }
  return level
}

// NOTE: AI games currently don't write to the games table (GameWrapper is local-only).
// Task 15 will wire AI games to Supabase and must set match_type: 'ai_hard' for hard difficulty.
const HARD_AI_MATCH_TYPE = 'ai_hard'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  // Use anon key + forwarded auth header for user verification (Supabase recommended pattern)
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  const userId = user.id

  // Admin client for all DB operations (bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { gameId } = await req.json()
  if (!gameId) return new Response('gameId required', { status: 400, headers: corsHeaders })

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, status, player_x_id, player_o_id, winner, match_type, player_x_rewards_status, player_x_rewards_retry_count, player_o_rewards_status, player_o_rewards_retry_count')
    .eq('id', gameId)
    .single()

  if (gameError || !game) return new Response('Game not found', { status: 404, headers: corsHeaders })
  if (game.status !== 'complete') return new Response('Game not complete', { status: 400, headers: corsHeaders })
  if (game.player_x_id !== userId && game.player_o_id !== userId) {
    return new Response('Not a participant', { status: 403, headers: corsHeaders })
  }

  // Each player processes their own rewards independently — use per-player columns so
  // the second player is not blocked by the first player's rewards_status.
  const myMarker = game.player_x_id === userId ? 'X' : 'O'
  const myRewardsStatus = myMarker === 'X' ? game.player_x_rewards_status : game.player_o_rewards_status
  const myRewardsRetryCount = myMarker === 'X' ? game.player_x_rewards_retry_count : game.player_o_rewards_retry_count
  const statusCol = myMarker === 'X' ? 'player_x_rewards_status' : 'player_o_rewards_status'
  const retryCol = myMarker === 'X' ? 'player_x_rewards_retry_count' : 'player_o_rewards_retry_count'

  if (myRewardsStatus === 'processing') {
    return new Response(JSON.stringify({ processing: true }), { status: 202, headers: corsHeaders })
  }
  if (myRewardsStatus === 'complete') {
    return new Response(JSON.stringify({ alreadyProcessed: true }), { status: 200, headers: corsHeaders })
  }
  if (myRewardsStatus === 'failed') {
    return new Response('Permanently failed', { status: 422, headers: corsHeaders })
  }

  await supabase.from('games').update({ [statusCol]: 'processing' }).eq('id', gameId)

  try {
    const { count: moveCount } = await supabase
      .from('game_moves')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId)

    // Fetch actual level for the early return case
    const { data: earlyProgression } = await supabase
      .from('player_progression')
      .select('level')
      .eq('user_id', userId)
      .single()
    const realLevel = earlyProgression?.level ?? 1

    if ((moveCount ?? 0) < MIN_MOVES) {
      await supabase.from('games').update({ [statusCol]: 'complete' }).eq('id', gameId)
      return new Response(JSON.stringify({
        xpAwarded: 0, creditsAwarded: 0,
        previousLevel: realLevel, newLevel: realLevel, leveledUp: false, newAchievements: []
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: configRows } = await supabase.from('reward_config').select('key, value')
    const config: Record<string, number> = {}
    for (const row of configRows ?? []) config[row.key] = row.value

    const isWin = game.winner === myMarker
    const isDraw = game.winner === 'draw'
    const isHardAI = game.match_type === HARD_AI_MATCH_TYPE

    let xpEarned = config.xp_game_complete ?? 20
    let creditsEarned = config.credits_game_complete ?? 10

    if (isWin) {
      xpEarned += config.xp_win_bonus ?? 30
      creditsEarned += config.credits_win_bonus ?? 25
      if (isHardAI) xpEarned += config.xp_win_hard_ai_bonus ?? 20
    } else if (isDraw) {
      xpEarned += config.xp_draw_bonus ?? 10
      creditsEarned += config.credits_draw_bonus ?? 10
    }

    const { data: progression } = await supabase
      .from('player_progression')
      .select('xp, level, total_credits_earned')
      .eq('user_id', userId)
      .single()

    const previousLevel = progression?.level ?? 1
    let newXP = (progression?.xp ?? 0) + xpEarned
    let newLevel = levelFromXP(newXP)
    let newTotalCredits = (progression?.total_credits_earned ?? 0) + creditsEarned

    await supabase.from('player_progression').upsert({
      user_id: userId,
      xp: newXP,
      level: newLevel,
      total_credits_earned: newTotalCredits
    })

    await supabase.rpc('increment_credits', { p_user_id: userId, p_amount: creditsEarned })

    if (newLevel !== previousLevel) {
      await supabase.from('profiles').update({ level: newLevel }).eq('id', userId)
    }

    const { data: stats } = await supabase
      .from('player_stats')
      .select('wins, losses, draws')
      .eq('player_id', userId)
      .single()

    const totalWins = stats?.wins ?? 0
    const totalGames = (stats?.wins ?? 0) + (stats?.losses ?? 0) + (stats?.draws ?? 0)

    const statMap: Record<string, number> = {
      total_wins: totalWins,
      total_games: totalGames,
      total_credits_earned: newTotalCredits
    }

    const { data: allAchievements } = await supabase.from('achievements').select('*')
    const { data: alreadyUnlocked } = await supabase
      .from('player_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    const unlockedIds = new Set((alreadyUnlocked ?? []).map((r: { achievement_id: string }) => r.achievement_id))

    const statAchievements = (allAchievements ?? []).filter((a: { condition_key: string; id: string; threshold: number }) =>
      a.condition_key !== 'level' && !unlockedIds.has(a.id) && statMap[a.condition_key] >= a.threshold
    )

    let bonusXP = 0
    let bonusCredits = 0
    const newAchievements: typeof statAchievements = []

    if (statAchievements.length > 0) {
      const { data: inserted } = await supabase
        .from('player_achievements')
        .upsert(
          statAchievements.map((a: { id: string }) => ({ user_id: userId, achievement_id: a.id })),
          { ignoreDuplicates: true }
        )
        .select('achievement_id')

      const insertedIds = new Set((inserted ?? []).map((r: { achievement_id: string }) => r.achievement_id))
      const insertedAchievements = statAchievements.filter((a: { id: string }) => insertedIds.has(a.id))
      newAchievements.push(...insertedAchievements)

      for (const a of insertedAchievements) {
        bonusXP += a.reward_xp
        bonusCredits += a.reward_credits
      }
    }

    if (bonusXP > 0 || bonusCredits > 0) {
      newXP += bonusXP
      newTotalCredits += bonusCredits
      newLevel = levelFromXP(newXP)
      creditsEarned += bonusCredits
      xpEarned += bonusXP

      await supabase.from('player_progression').update({
        xp: newXP,
        level: newLevel,
        total_credits_earned: newTotalCredits
      }).eq('user_id', userId)

      if (bonusCredits > 0) {
        await supabase.rpc('increment_credits', { p_user_id: userId, p_amount: bonusCredits })
      }

      if (newLevel !== previousLevel) {
        await supabase.from('profiles').update({ level: newLevel }).eq('id', userId)
      }
    }

    statMap.level = newLevel
    const levelAchievements = (allAchievements ?? []).filter((a: { condition_key: string; id: string; threshold: number }) =>
      a.condition_key === 'level' &&
      !unlockedIds.has(a.id) &&
      !newAchievements.some((na: { id: string }) => na.id === a.id) &&
      newLevel >= a.threshold
    )

    if (levelAchievements.length > 0) {
      const { data: insertedLevel } = await supabase
        .from('player_achievements')
        .upsert(
          levelAchievements.map((a: { id: string }) => ({ user_id: userId, achievement_id: a.id })),
          { ignoreDuplicates: true }
        )
        .select('achievement_id')

      const insertedLevelIds = new Set((insertedLevel ?? []).map((r: { achievement_id: string }) => r.achievement_id))
      const insertedLevelAchievements = levelAchievements.filter((a: { id: string }) => insertedLevelIds.has(a.id))
      newAchievements.push(...insertedLevelAchievements)

      let levelBonusXP = 0
      let levelBonusCredits = 0
      for (const a of insertedLevelAchievements) {
        levelBonusXP += a.reward_xp
        levelBonusCredits += a.reward_credits
      }

      if (levelBonusXP > 0 || levelBonusCredits > 0) {
        newXP += levelBonusXP
        newTotalCredits += levelBonusCredits
        creditsEarned += levelBonusCredits
        xpEarned += levelBonusXP
        const finalLevel = levelFromXP(newXP)

        await supabase.from('player_progression').update({
          xp: newXP,
          level: finalLevel,
          total_credits_earned: newTotalCredits
        }).eq('user_id', userId)

        if (levelBonusCredits > 0) {
          await supabase.rpc('increment_credits', { p_user_id: userId, p_amount: levelBonusCredits })
        }

        if (finalLevel !== newLevel) {
          newLevel = finalLevel
          await supabase.from('profiles').update({ level: newLevel }).eq('id', userId)
        }
      }
    }

    await supabase.from('games').update({ [statusCol]: 'complete' }).eq('id', gameId)

    return new Response(JSON.stringify({
      xpAwarded: xpEarned,
      creditsAwarded: creditsEarned,
      previousLevel,
      newLevel,
      leveledUp: newLevel > previousLevel,
      newAchievements: newAchievements.map((a: {
        key: string; name: string; description: string; icon_url: string | null;
        reward_xp: number; reward_credits: number; reward_skin_id: string | null
      }) => ({
        key: a.key,
        name: a.name,
        description: a.description,
        icon_url: a.icon_url,
        reward_xp: a.reward_xp,
        reward_credits: a.reward_credits,
        reward_skin_id: a.reward_skin_id ?? null
      }))
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('post-game-handler error:', err)
    // Re-fetch current retry count to avoid stale read
    const { data: currentGame } = await supabase
      .from('games')
      .select('player_x_rewards_retry_count, player_o_rewards_retry_count')
      .eq('id', gameId)
      .single()
    const currentRetryCount = (myMarker === 'X'
      ? currentGame?.player_x_rewards_retry_count
      : currentGame?.player_o_rewards_retry_count) ?? myRewardsRetryCount ?? 0
    const retryCount = currentRetryCount + 1
    const newStatus = retryCount >= 3 ? 'failed' : 'pending'
    await supabase.from('games').update({
      [statusCol]: newStatus,
      [retryCol]: retryCount
    }).eq('id', gameId)
    return new Response('Internal error', { status: 500, headers: corsHeaders })
  }
})
