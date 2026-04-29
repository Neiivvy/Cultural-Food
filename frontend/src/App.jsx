import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Public pages
import HomePage             from './pages/HomePage';
import FoodDetailPage       from './pages/FoodDetailPage';
import Login                from './pages/Login';
import Signup               from './pages/Signup';

// Authenticated user pages
import UserHomePage         from './pages/UserHomePage';
import UserProfilePage      from './pages/UserProfilePage';
import PublicProfilePage    from './pages/PublicProfilePage';
import AddPostPage          from './pages/AddPostPage';
import RecipesPage          from './pages/RecipesPage';
import QuestionsPage        from './pages/QuestionsPage';
import PostDetailPage       from './pages/PostDetailPage';
import ReelsPage            from './pages/ReelsPage';

// Food category page
import FoodCategoryPage     from './pages/FoodCategoryPage';

// Contribute pages
import ContributePage       from './pages/ContributePage';
import ContributeFormPage   from './pages/ContributeFormPage';

// Admin pages
import AdminLoginPage       from './pages/AdminLoginPage';
import AdminDashboard       from './pages/AdminDashboard';

// Nav
import UserNavBar           from './components/UserNavBar';

import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

const UserLayout = ({ children }) => (
  <div className="user-layout">
    <UserNavBar />
    <main className="user-main">{children}</main>
  </div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app">
        <Routes>

          {/* ── Public ── */}
          <Route path="/"                     element={<HomePage />} />
          <Route path="/food/:foodId"         element={<FoodDetailPage />} />
          <Route path="/login"                element={<Login />} />
          <Route path="/signup"               element={<Signup />} />
          <Route path="/contribute"           element={<ContributePage />} />
          <Route path="/foods"                element={<FoodCategoryPage />} />
          <Route path="/category/:categoryId" element={<FoodCategoryPage />} />

          <Route path="/contribute/form" element={
            <PrivateRoute><ContributeFormPage /></PrivateRoute>
          } />

          {/* ── Authenticated ── */}
          <Route path="/homeUser" element={
            <PrivateRoute><UserLayout><UserHomePage /></UserLayout></PrivateRoute>
          } />
          <Route path="/recipes" element={
            <PrivateRoute><UserLayout><RecipesPage /></UserLayout></PrivateRoute>
          } />
          <Route path="/reels" element={
            <PrivateRoute><UserLayout><ReelsPage /></UserLayout></PrivateRoute>
          } />
          <Route path="/questions" element={
            <PrivateRoute><UserLayout><QuestionsPage /></UserLayout></PrivateRoute>
          } />
          <Route path="/add" element={
            <PrivateRoute><UserLayout><AddPostPage /></UserLayout></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><UserLayout><UserProfilePage /></UserLayout></PrivateRoute>
          } />
          <Route path="/post/:id" element={
            <PrivateRoute><UserLayout><PostDetailPage /></UserLayout></PrivateRoute>
          } />

          {/* ── Public user profiles ── */}
          <Route path="/user/:userId" element={
            <PrivateRoute><UserLayout><PublicProfilePage /></UserLayout></PrivateRoute>
          } />

          {/* ── Admin ── */}
          <Route path="/admin/login"     element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;