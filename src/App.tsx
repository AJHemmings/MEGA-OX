import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import OnboardingPage from './components/auth/OnboardingPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ProfilePage from './components/profile/ProfilePage';
import SettingsPage from './components/profile/SettingsPage';
import GameWrapper from './components/GameWrapper';
import MatchmakingPage from './components/game/MatchmakingPage';
import LeaderboardPage from './components/leaderboard/LeaderboardPage';
import SeasonPage from './components/season/SeasonPage';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/season" element={<SeasonPage />} />

        {/* Training mode — accessible without auth */}
        <Route path="/training" element={<GameWrapper gameMode="single" onBackToMenu={() => {}} />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainMenu onGameModeSelect={() => {}} />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/game/:id" element={<GameWrapper gameMode="single" onBackToMenu={() => {}} />} />
          <Route path="/matchmaking" element={<MatchmakingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
