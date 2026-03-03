import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import DecisionDetail from './pages/DecisionDetail';
import CreateDecision from './pages/CreateDecision';
import VotingMethods from './pages/VotingMethods';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }
  
  return !user ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Navbar />
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/groups" element={
          <PrivateRoute>
            <Navbar />
            <Groups />
          </PrivateRoute>
        } />
        <Route path="/groups/:id" element={
          <PrivateRoute>
            <Navbar />
            <GroupDetail />
          </PrivateRoute>
        } />
        <Route path="/decisions/:id" element={
          <PrivateRoute>
            <Navbar />
            <DecisionDetail />
          </PrivateRoute>
        } />
        <Route path="/groups/:groupId/decisions/new" element={
          <PrivateRoute>
            <Navbar />
            <CreateDecision />
          </PrivateRoute>
        } />
        <Route path="/voting-methods" element={
          <PrivateRoute>
            <Navbar />
            <VotingMethods />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Navbar />
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <ThemeToggle />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
