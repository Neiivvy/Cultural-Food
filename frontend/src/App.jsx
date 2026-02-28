import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CultureBasedFoodPage from './pages/CultureBasedFoodPage';
import FoodDetailPage from './pages/FoodDetailPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/culture/:cultureName" element={<CultureBasedFoodPage />} />
          <Route path="/food/:foodId" element={<FoodDetailPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;