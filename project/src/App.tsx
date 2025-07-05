import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserContextProvider, useUserContext } from './contexts/UserContext';
import LanguageSelector from './components/LanguageSelector';
import MotivationalPopup from './components/MotivationalPopup';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/Dashboard';
import Community from './components/Community';
import Profile from './components/Profile';
import Rewards from './components/Rewards';
import UrgeHelper from './components/UrgeHelper';
import './i18n';

const AppContent: React.FC = () => {
  const { currentUser, loading, userData } = useAuth();
  const { i18n } = useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showMotivationalPopup, setShowMotivationalPopup] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (!savedLanguage) {
      setShowLanguageSelector(true);
    } else {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const handleLanguageSelect = (language: string) => {
    localStorage.setItem('selectedLanguage', language);
    i18n.changeLanguage(language);
    setShowLanguageSelector(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showLanguageSelector) {
    return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
  }

  return (
    <UserContextProvider>
      <AppWithUserContext 
        currentUser={currentUser}
        userData={userData}
        showMotivationalPopup={showMotivationalPopup}
        setShowMotivationalPopup={setShowMotivationalPopup}
      />
    </UserContextProvider>
  );
};

interface AppWithUserContextProps {
  currentUser: any;
  userData: any;
  showMotivationalPopup: boolean;
  setShowMotivationalPopup: (show: boolean) => void;
}

const AppWithUserContext: React.FC<AppWithUserContextProps> = ({ 
  currentUser, 
  userData, 
  showMotivationalPopup, 
  setShowMotivationalPopup 
}) => {
  const { lastDailyPopup, loading: userContextLoading } = useUserContext();

  // Check if we should show the motivational popup
  useEffect(() => {
    if (currentUser && userData && !userContextLoading) {
      const today = new Date().toDateString();
      const lastPopupDate = lastDailyPopup;
      
      // Show popup if user hasn't seen it today
      if (lastPopupDate !== today) {
        // Add a small delay to ensure smooth transition
        const timer = setTimeout(() => {
          setShowMotivationalPopup(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, userData, lastDailyPopup, userContextLoading, setShowMotivationalPopup]);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/login" 
          element={
            currentUser ? <Navigate to="/dashboard" /> : <Login />
          } 
        />
        <Route 
          path="/signup" 
          element={
            currentUser ? <Navigate to="/dashboard" /> : <Signup />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            currentUser ? <Dashboard /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/community" 
          element={
            currentUser ? <Community /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/rewards" 
          element={
            currentUser ? <Rewards /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/profile" 
          element={
            currentUser ? <Profile /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/urge-helper" 
          element={
            currentUser ? <UrgeHelper /> : <Navigate to="/login" />
          } 
        />
      </Routes>
      
      {/* Motivational Popup */}
      {showMotivationalPopup && (
        <MotivationalPopup onClose={() => setShowMotivationalPopup(false)} />
      )}
      
      <Toaster position="top-center" />
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;