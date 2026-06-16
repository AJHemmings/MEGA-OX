export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          condition_key: string
          description: string
          icon_url: string | null
          id: string
          key: string
          name: string
          reward_credits: number
          reward_skin_id: string | null
          reward_xp: number
          threshold: number
        }
        Insert: {
          condition_key: string
          description: string
          icon_url?: string | null
          id?: string
          key: string
          name: string
          reward_credits?: number
          reward_skin_id?: string | null
          reward_xp?: number
          threshold: number
        }
        Update: {
          condition_key?: string
          description?: string
          icon_url?: string | null
          id?: string
          key?: string
          name?: string
          reward_credits?: number
          reward_skin_id?: string | null
          reward_xp?: number
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievements_reward_skin_id_fkey"
            columns: ["reward_skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "admin_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_config: {
        Row: {
          difficulty: string
          id: string
          rule_name: string
          strength: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          difficulty: string
          id?: string
          rule_name: string
          strength: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          difficulty?: string
          id?: string
          rule_name?: string
          strength?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "ai_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetic_items: {
        Row: {
          animated: boolean
          archived: boolean
          asset_url: string | null
          featured: boolean
          id: string
          name: string
          price: number | null
          rarity: string
          source: string
          type: string
          visible: boolean
        }
        Insert: {
          animated?: boolean
          archived?: boolean
          asset_url?: string | null
          featured?: boolean
          id?: string
          name: string
          price?: number | null
          rarity: string
          source: string
          type: string
          visible?: boolean
        }
        Update: {
          animated?: boolean
          archived?: boolean
          asset_url?: string | null
          featured?: boolean
          id?: string
          name?: string
          price?: number | null
          rarity?: string
          source?: string
          type?: string
          visible?: boolean
        }
        Relationships: []
      }
      currency_balance: {
        Row: {
          coins: number
          player_id: string
        }
        Insert: {
          coins?: number
          player_id: string
        }
        Update: {
          coins?: number
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "currency_balance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "currency_balance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_moves: {
        Row: {
          cell_index: number
          created_at: string | null
          game_id: string
          id: string
          micro_board_index: number
          move_number: number
          player_id: string
        }
        Insert: {
          cell_index: number
          created_at?: string | null
          game_id: string
          id?: string
          micro_board_index: number
          move_number: number
          player_id: string
        }
        Update: {
          cell_index?: number
          created_at?: string | null
          game_id?: string
          id?: string
          micro_board_index?: number
          move_number?: number
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_moves_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_moves_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "game_moves_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          forfeit_player_id: string | null
          game_code: string | null
          id: string
          match_type: string
          next_micro_board: number | null
          next_player: string
          player_o_id: string | null
          player_o_rewards_retry_count: number
          player_o_rewards_status: string
          player_x_id: string | null
          player_x_rewards_retry_count: number
          player_x_rewards_status: string
          rematch_game_id: string | null
          rematch_o_intent: string | null
          rematch_x_intent: string | null
          rewards_retry_count: number
          rewards_status: string
          rps_creator_pick: string | null
          rps_joiner_pick: string | null
          season_id: string | null
          state: Json
          status: string
          tournament_id: string | null
          updated_at: string | null
          winner: string | null
        }
        Insert: {
          created_at?: string | null
          forfeit_player_id?: string | null
          game_code?: string | null
          id?: string
          match_type?: string
          next_micro_board?: number | null
          next_player?: string
          player_o_id?: string | null
          player_o_rewards_retry_count?: number
          player_o_rewards_status?: string
          player_x_id?: string | null
          player_x_rewards_retry_count?: number
          player_x_rewards_status?: string
          rematch_game_id?: string | null
          rematch_o_intent?: string | null
          rematch_x_intent?: string | null
          rewards_retry_count?: number
          rewards_status?: string
          rps_creator_pick?: string | null
          rps_joiner_pick?: string | null
          season_id?: string | null
          state?: Json
          status?: string
          tournament_id?: string | null
          updated_at?: string | null
          winner?: string | null
        }
        Update: {
          created_at?: string | null
          forfeit_player_id?: string | null
          game_code?: string | null
          id?: string
          match_type?: string
          next_micro_board?: number | null
          next_player?: string
          player_o_id?: string | null
          player_o_rewards_retry_count?: number
          player_o_rewards_status?: string
          player_x_id?: string | null
          player_x_rewards_retry_count?: number
          player_x_rewards_status?: string
          rematch_game_id?: string | null
          rematch_o_intent?: string | null
          rematch_x_intent?: string | null
          rewards_retry_count?: number
          rewards_status?: string
          rps_creator_pick?: string | null
          rps_joiner_pick?: string | null
          season_id?: string | null
          state?: Json
          status?: string
          tournament_id?: string | null
          updated_at?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_forfeit_player_id_fkey"
            columns: ["forfeit_player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "games_forfeit_player_id_fkey"
            columns: ["forfeit_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_player_o_id_fkey"
            columns: ["player_o_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "games_player_o_id_fkey"
            columns: ["player_o_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_player_x_id_fkey"
            columns: ["player_x_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "games_player_x_id_fkey"
            columns: ["player_x_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_streaks: {
        Row: {
          current_streak: number
          last_login_date: string | null
          longest_streak: number
          player_id: string
        }
        Insert: {
          current_streak?: number
          last_login_date?: string | null
          longest_streak?: number
          player_id: string
        }
        Update: {
          current_streak?: number
          last_login_date?: string | null
          longest_streak?: number
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_streaks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "login_streaks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          joined_at: string | null
          match_type: string
          mmr: number
          player_id: string
        }
        Insert: {
          joined_at?: string | null
          match_type?: string
          mmr: number
          player_id: string
        }
        Update: {
          joined_at?: string | null
          match_type?: string
          mmr?: number
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "matchmaking_queue_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          category: string
          content: string
          created_by: string | null
          id: string
          image_url: string | null
          published_at: string | null
          title: string
        }
        Insert: {
          category: string
          content: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "news_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      player_inventory: {
        Row: {
          acquired_at: string | null
          acquisition_source: string
          item_id: string
          player_id: string
        }
        Insert: {
          acquired_at?: string | null
          acquisition_source: string
          item_id: string
          player_id: string
        }
        Update: {
          acquired_at?: string | null
          acquisition_source?: string
          item_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_inventory_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_inventory_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_progression: {
        Row: {
          level: number
          total_credits_earned: number
          user_id: string
          xp: number
        }
        Insert: {
          level?: number
          total_credits_earned?: number
          user_id: string
          xp?: number
        }
        Update: {
          level?: number
          total_credits_earned?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          draws: number
          losses: number
          mmr: number
          player_id: string
          rank_tier: string
          wins: number
        }
        Insert: {
          draws?: number
          losses?: number
          mmr?: number
          player_id: string
          rank_tier?: string
          wins?: number
        }
        Update: {
          draws?: number
          losses?: number
          mmr?: number
          player_id?: string
          rank_tier?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_avatar_id: string | null
          active_badge_id: string | null
          active_banner_id: string | null
          active_board_id: string | null
          active_marker_id: string | null
          active_theme_id: string | null
          avatar_url: string | null
          created_at: string | null
          id: string
          level: number
          role: string
          username: string
        }
        Insert: {
          active_avatar_id?: string | null
          active_badge_id?: string | null
          active_banner_id?: string | null
          active_board_id?: string | null
          active_marker_id?: string | null
          active_theme_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          id: string
          level?: number
          role?: string
          username: string
        }
        Update: {
          active_avatar_id?: string | null
          active_badge_id?: string | null
          active_banner_id?: string | null
          active_board_id?: string | null
          active_marker_id?: string | null
          active_theme_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          level?: number
          role?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_active_board"
            columns: ["active_board_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_active_marker"
            columns: ["active_marker_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_active_theme"
            columns: ["active_theme_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_avatar_id_fkey"
            columns: ["active_avatar_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_badge_id_fkey"
            columns: ["active_badge_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_banner_id_fkey"
            columns: ["active_banner_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_catalog: {
        Row: {
          coin_amount: number | null
          day_number: number
          id: string
          item_id: string | null
          reward_type: string
        }
        Insert: {
          coin_amount?: number | null
          day_number: number
          id?: string
          item_id?: string | null
          reward_type: string
        }
        Update: {
          coin_amount?: number | null
          day_number?: number
          id?: string
          item_id?: string | null
          reward_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_catalog_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_claims: {
        Row: {
          claimed_at: string | null
          player_id: string
          reward_catalog_id: string
        }
        Insert: {
          claimed_at?: string | null
          player_id: string
          reward_catalog_id: string
        }
        Update: {
          claimed_at?: string | null
          player_id?: string
          reward_catalog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_claims_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "reward_claims_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_claims_reward_catalog_id_fkey"
            columns: ["reward_catalog_id"]
            isOneToOne: false
            referencedRelation: "reward_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_config: {
        Row: {
          key: string
          value: number
        }
        Insert: {
          key: string
          value: number
        }
        Update: {
          key?: string
          value?: number
        }
        Relationships: []
      }
      rps_picks: {
        Row: {
          game_id: string
          pick: string
          user_id: string
        }
        Insert: {
          game_id: string
          pick: string
          user_id: string
        }
        Update: {
          game_id?: string
          pick?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rps_picks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      season_prizes: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          claimed_by: string | null
          coin_amount: number | null
          id: string
          item_id: string | null
          position: number
          reward_type: string
          season_id: string | null
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          coin_amount?: number | null
          id?: string
          item_id?: string | null
          position: number
          reward_type: string
          season_id?: string | null
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          coin_amount?: number | null
          id?: string
          item_id?: string | null
          position?: number
          reward_type?: string
          season_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_prizes_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_prizes_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_prizes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_standings: {
        Row: {
          draws: number
          losses: number
          player_id: string
          points: number
          rank_position: number | null
          season_id: string
          wins: number
        }
        Insert: {
          draws?: number
          losses?: number
          player_id: string
          points?: number
          rank_position?: number | null
          season_id: string
          wins?: number
        }
        Update: {
          draws?: number
          losses?: number
          player_id?: string
          points?: number
          rank_position?: number | null
          season_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "season_standings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "season_standings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          end_date: string
          id: string
          name: string
          rules_config: Json | null
          start_date: string
          status: string
        }
        Insert: {
          end_date: string
          id?: string
          name: string
          rules_config?: Json | null
          start_date: string
          status?: string
        }
        Update: {
          end_date?: string
          id?: string
          name?: string
          rules_config?: Json | null
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      skins: {
        Row: {
          asset_url: string
          created_at: string
          id: string
          name: string
          price: number | null
          type: string
        }
        Insert: {
          asset_url?: string
          created_at?: string
          id?: string
          name: string
          price?: number | null
          type: string
        }
        Update: {
          asset_url?: string
          created_at?: string
          id?: string
          name?: string
          price?: number | null
          type?: string
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          eliminated: boolean
          player_id: string
          seed: number | null
          tournament_id: string
        }
        Insert: {
          eliminated?: boolean
          player_id: string
          seed?: number | null
          tournament_id: string
        }
        Update: {
          eliminated?: boolean
          player_id?: string
          seed?: number | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "tournament_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          player_id: string
          registered_at: string | null
          status: string
          tournament_id: string
        }
        Insert: {
          player_id: string
          registered_at?: string | null
          status?: string
          tournament_id: string
        }
        Update: {
          player_id?: string
          registered_at?: string | null
          status?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "tournament_registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_by: string | null
          format: string
          id: string
          name: string
          prize_description: string | null
          start_date: string | null
          status: string
        }
        Insert: {
          created_by?: string | null
          format?: string
          id?: string
          name: string
          prize_description?: string | null
          start_date?: string | null
          status?: string
        }
        Update: {
          created_by?: string | null
          format?: string
          id?: string
          name?: string
          prize_description?: string | null
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "tournaments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          item_id: string | null
          player_id: string | null
          stripe_payment_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          item_id?: string | null
          player_id?: string | null
          stripe_payment_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          item_id?: string | null
          player_id?: string | null
          stripe_payment_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "transactions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_progress: {
        Row: {
          completed_at: string | null
          page_key: string
          player_id: string
        }
        Insert: {
          completed_at?: string | null
          page_key: string
          player_id: string
        }
        Update: {
          completed_at?: string | null
          page_key?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "tutorial_progress_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_equipped_skins: {
        Row: {
          board_skin_id: string | null
          marker_o_skin_id: string | null
          marker_x_skin_id: string | null
          user_id: string
          won_board_o_skin_id: string | null
          won_board_x_skin_id: string | null
        }
        Insert: {
          board_skin_id?: string | null
          marker_o_skin_id?: string | null
          marker_x_skin_id?: string | null
          user_id: string
          won_board_o_skin_id?: string | null
          won_board_x_skin_id?: string | null
        }
        Update: {
          board_skin_id?: string | null
          marker_o_skin_id?: string | null
          marker_x_skin_id?: string | null
          user_id?: string
          won_board_o_skin_id?: string | null
          won_board_x_skin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_equipped_skins_board_skin_id_fkey"
            columns: ["board_skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipped_skins_marker_o_skin_id_fkey"
            columns: ["marker_o_skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipped_skins_marker_x_skin_id_fkey"
            columns: ["marker_x_skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipped_skins_won_board_o_skin_id_fkey"
            columns: ["won_board_o_skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipped_skins_won_board_x_skin_id_fkey"
            columns: ["won_board_x_skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skins: {
        Row: {
          acquired_at: string
          skin_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          skin_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          skin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skins_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          draws: number | null
          level: number | null
          losses: number | null
          player_id: string | null
          position: number | null
          rank_tier: string | null
          username: string | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_grant_credits: { Args: { amount: number }; Returns: undefined }
      admin_grant_xp: { Args: { amount: number }; Returns: undefined }
      increment_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      purchase_item: { Args: { p_item_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
