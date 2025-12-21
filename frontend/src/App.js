import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from './components/ui/sonner';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Performance from './pages/Performance';
import Maintenance from './pages/Maintenance';
import Predictions from './pages/Predictions';
import Settings from './pages/Settings';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));

    // Initialize app
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Test API connection
      const response = await axios.get(`${API}/`);
      console.log('API Connected:', response.data);

      // Import initial data call removed to prevent overwriting user data
      // Data should persist in the backend
      console.log('App initialized');

    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Solar Dashboard...</h2>
          <p className="text-gray-500 mt-2">Initializing predictive maintenance system</p>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Router>
          <div className="flex">
            <Navigation darkMode={darkMode} toggleTheme={toggleTheme} />
            <main className="flex-1 ml-64">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </Router>
        <Toaster />
      </div>
    </div>
  );
}

export default App;