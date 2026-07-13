import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import MultiplayerMenu from './components/MultiplayerMenu';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import OnboardingPage from './components/auth/OnboardingPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ProfilePage from './components/profile/ProfilePage';
import SettingsPage from './components/profile/SettingsPage';
import GameWrapper from './components/GameWrapper';
import MatchmakingPage from './components/game/MatchmakingPage';
import OnlineGameView from './components/game/OnlineGameView';
import LeaderboardPage from './components/leaderboard/LeaderboardPage';
import SeasonPage from './components/season/SeasonPage';
import HowToPlayPage from './components/game/HowToPlayPage';
import HowToPlaySelectPage from './components/game/HowToPlaySelectPage';
import LocalRPSScreen from './components/game/LocalRPSScreen';
import { AchievementsPage } from './components/achievements/AchievementsPage';
import CustomisePage from './components/profile/CustomisePage';
import ShopPage from './components/shop/ShopPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GuestLandingPage from './components/GuestLandingPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import DemoGamePage from './components/DemoGamePage';
import { AdminRoute } from './components/admin/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import SkinsManager from './components/admin/SkinsManager';
import EmojiManager from './components/admin/EmojiManager';
import AchievementsManager from './components/admin/AchievementsManager';
import ShopManager from './components/admin/ShopManager';
import AiTuner from './components/admin/AiTuner';
import BugReportsManager from './components/admin/BugReportsManager';
import { PresenceProvider } from './contexts/PresenceContext';
import { ProgressionProvider } from './contexts/ProgressionContext';
import { FriendsDrawer } from './components/friends/FriendsDrawer';
import { supabase } from './lib/supabase';

// Thin wrappers so GameWrapper gets a real navigate callback from the router
const TrainingRoute: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const difficulty = (searchParams.get('difficulty') ?? 'easy') as 'easy' | 'medium' | 'hard';
  return <GameWrapper gameMode="single" difficulty={difficulty} onBackToMenu={() => navigate('/menu')} />;
};

const LocalGameRoute: React.FC = () => {
  const navigate = useNavigate();
  const [p1GoesFirst, setP1GoesFirst] = React.useState<boolean | null>(null);

  if (p1GoesFirst === null) {
    return <LocalRPSScreen onResult={setP1GoesFirst} />;
  }

  return (
    <GameWrapper
      gameMode="local"
      p1GoesFirst={p1GoesFirst}
      onBackToMenu={() => navigate('/multiplayer')}
    />
  );
};

const OnlineGameRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <OnlineGameView gameId={id} />;
};

// Shows GuestLandingPage to unauthenticated users; redirects logged-in users to /menu
const RootRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a2332' }}>
      <div style={{ color: '#00d4aa', fontSize: '18px' }}>Loading...</div>
    </div>
  );
  if (user) return <Navigate to="/menu" replace />;
  return <GuestLandingPage />;
};

// AppShell sits inside AuthProvider so it can call useAuth() and hold
// friends drawer state. PresenceProvider wraps everything so any child
// component can broadcast/read presence.
const AppShell: React.FC = () => {
  const { user } = useAuth();
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setPendingCount(0);
      return;
    }
    const userId = user.id;

    async function refreshCount() {
      const [{ count: friendCount }, { count: inviteCount }] = await Promise.all([
        supabase.from('friendships').select('*', { count: 'exact', head: true })
          .eq('addressee_id', userId).eq('status', 'pending'),
        supabase.from('game_invites').select('*', { count: 'exact', head: true })
          .eq('challenged_id', userId).eq('status', 'pending'),
      ]);
      setPendingCount((friendCount ?? 0) + (inviteCount ?? 0));
    }

    refreshCount();

    const channel = supabase
      .channel(`pending-badge-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, refreshCount)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_invites' }, refreshCount)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  return (
    <PresenceProvider>
      {/* Friends icon — fixed overlay, only shown when logged in */}
      {user && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => setFriendsOpen(true)}
              title="Friends"
              style={{
                background: 'none', border: 'none', color: '#fff',
                fontSize: 20, cursor: 'pointer', padding: '4px 8px',
              }}
            >👥</button>
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                background: '#ef4444', color: '#fff',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, pointerEvents: 'none',
              }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
        </div>
      )}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/demo" element={<DemoGamePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/season" element={<SeasonPage />} />
        <Route path="/how-to-play" element={<HowToPlaySelectPage />} />
        <Route path="/how-to-play/:mode" element={<HowToPlayPage />} />

        {/* Game modes — accessible without auth for now */}
        <Route path="/training" element={<TrainingRoute />} />
        <Route path="/local" element={<LocalGameRoute />} />
        <Route path="/multiplayer" element={<MultiplayerMenu />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/game/:id" element={<OnlineGameRoute />} />
          <Route path="/matchmaking" element={<MatchmakingPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/customise" element={<CustomisePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/admin" element={<Navigate to="/admin/skins" replace />} />
          <Route path="/admin/skins" element={
            <AdminRoute><AdminLayout><SkinsManager /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/achievements" element={
            <AdminRoute><AdminLayout><AchievementsManager /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/emojis" element={
            <AdminRoute><AdminLayout><EmojiManager /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/shop" element={
            <AdminRoute requiredRole="super_admin"><AdminLayout><ShopManager /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/ai-tuner" element={
            <AdminRoute requiredRole="super_admin"><AdminLayout><AiTuner /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/bugs" element={
            <AdminRoute><AdminLayout><BugReportsManager /></AdminLayout></AdminRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {user && <FriendsDrawer isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} />}
    </PresenceProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProgressionProvider>
        <AppShell />
      </ProgressionProvider>
    </AuthProvider>
  );
};

export default App;
