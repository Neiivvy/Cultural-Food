import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Existing pages — untouched
import HomePage from './pages/HomePage';
import CultureBasedFoodPage from './pages/CultureBasedFoodPage';
import FoodDetailPage from './pages/FoodDetailPage';
import Login from './pages/Login';
import Signup from './pages/Signup';

// New authenticated user pages
import UserHomePage from './pages/UserHomePage';
import UserProfilePage from './pages/UserProfilePage';
import AddPostPage from './pages/AddPostPage';
import RecipesPage from './pages/RecipesPage';
import QuestionsPage from './pages/QuestionsPage';
import PostDetailPage from './pages/PostDetailPage';
import UserNavBar from './components/UserNavBar';

import './App.css';

// Auth guard: redirect to /login if not logged in
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Layout wrapper that adds UserNavBar to all authenticated pages
const UserLayout = ({ children }) => (
  <div className="user-layout">
    <UserNavBar />
    <main className="user-main">{children}</main>
  </div>
);

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* ── Public / existing routes ── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/culture/:cultureName" element={<CultureBasedFoodPage />} />
          <Route path="/food/:foodId" element={<FoodDetailPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Authenticated user routes ── */}
          <Route path="/homeUser" element={
            <PrivateRoute>
              <UserLayout><UserHomePage /></UserLayout>
            </PrivateRoute>
          } />
          <Route path="/recipes" element={
            <PrivateRoute>
              <UserLayout><RecipesPage /></UserLayout>
            </PrivateRoute>
          } />
          <Route path="/questions" element={
            <PrivateRoute>
              <UserLayout><QuestionsPage /></UserLayout>
            </PrivateRoute>
          } />
          <Route path="/add" element={
            <PrivateRoute>
              <UserLayout><AddPostPage /></UserLayout>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <UserLayout><UserProfilePage /></UserLayout>
            </PrivateRoute>
          } />
          {/* Post detail accessible from any page, with UserNavBar when logged in */}
          <Route path="/post/:id" element={
            <PrivateRoute>
              <UserLayout><PostDetailPage /></UserLayout>
            </PrivateRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;