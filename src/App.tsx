import React from 'react';
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
import DemoGamePage from './components/DemoGamePage';
import { AdminRoute } from './components/admin/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import SkinsManager from './components/admin/SkinsManager';
import EmojiManager from './components/admin/EmojiManager';
import AchievementsManager from './components/admin/AchievementsManager';
import ShopManager from './components/admin/ShopManager';
import AiTuner from './components/admin/AiTuner';

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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/demo" element={<DemoGamePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
