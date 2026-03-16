import React from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
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
import { AuthProvider } from './contexts/AuthContext';

// Thin wrappers so GameWrapper gets a real navigate callback from the router
const TrainingRoute: React.FC = () => {
  const navigate = useNavigate();
  return <GameWrapper gameMode="single" onBackToMenu={() => navigate('/')} />;
};

const LocalGameRoute: React.FC = () => {
  const navigate = useNavigate();
  return <GameWrapper gameMode="local" onBackToMenu={() => navigate('/multiplayer')} />;
};

const OnlineGameRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <OnlineGameView gameId={id} />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/season" element={<SeasonPage />} />

        {/* Game modes — accessible without auth for now */}
        <Route path="/training" element={<TrainingRoute />} />
        <Route path="/local" element={<LocalGameRoute />} />
        <Route path="/multiplayer" element={<MultiplayerMenu />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainMenu />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/game/:id" element={<OnlineGameRoute />} />
          <Route path="/matchmaking" element={<MatchmakingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
