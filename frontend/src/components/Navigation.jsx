import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BarChart3,
  Settings,
  Wrench,
  Brain,
  Sun,
  Moon,
  Zap,
  Activity
} from 'lucide-react';

const Navigation = ({ darkMode, toggleTheme }) => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: Home,
      description: 'Overview & KPIs'
    },
    {
      path: '/performance',
      name: 'Performance',
      icon: BarChart3,
      description: 'Analysis & Charts'
    },
    {
      path: '/maintenance',
      name: 'Maintenance',
      icon: Wrench,
      description: 'Schedule & History'
    },
    {
      path: '/predictions',
      name: 'Predictions',
      icon: Brain,
      description: 'AI Insights & Forecasts'
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: Settings,
      description: 'Data & Configuration'
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Solar Panel
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Predictive Maintenance
            </p>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">System Online</span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <Activity className="h-4 w-4 text-blue-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Last update: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${active
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className={`h-5 w-5 transition-colors duration-200 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }`} />
              <div className="flex-1">
                <div className={`font-medium ${active ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                  {item.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle & Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
        >
          {darkMode ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-500" />
          )}
          <span className="font-medium">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>


      </div>
    </div>
  );
};

export default Navigation;