import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Users, Gift, User, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { 
      icon: Home, 
      label: t('dashboard'), 
      path: '/dashboard',
      isActive: location.pathname === '/dashboard'
    },
    { 
      icon: Users, 
      label: t('community'), 
      path: '/community',
      isActive: location.pathname === '/community'
    },
    // Central Red Alert Button will be inserted here
    { 
      icon: Gift, 
      label: t('rewards'), 
      path: '/rewards',
      isActive: location.pathname === '/rewards'
    },
    { 
      icon: User, 
      label: t('profile'), 
      path: '/profile',
      isActive: location.pathname === '/profile'
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-around items-center">
          {/* First two nav items */}
          {navItems.slice(0, 2).map((item) => (
            <motion.button
              key={item.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 ${
                item.isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className={`w-6 h-6 mb-1 ${item.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          ))}

          {/* Central Red Alert Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/urge-helper')}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              location.pathname === '/urge-helper'
                ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-red-200'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200 hover:shadow-xl'
            }`}
            style={{ marginTop: '-8px' }}
          >
            <Shield className="w-8 h-8 text-white" />
            
            {/* Pulse animation for urgency */}
            {location.pathname !== '/urge-helper' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.button>

          {/* Last two nav items */}
          {navItems.slice(2).map((item) => (
            <motion.button
              key={item.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 ${
                item.isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className={`w-6 h-6 mb-1 ${item.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;