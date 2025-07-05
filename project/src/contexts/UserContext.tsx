import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface UnlockedItems {
  themes: string[];
  badges: string[];
  music: string[];
  features: string[];
}

interface UserContextData {
  unlockedItems: UnlockedItems;
  activeTheme: string;
  lastDailyPopup: string;
  updateUserContext: (data: Partial<UserContextData>) => void;
  hasUnlockedItem: (category: keyof UnlockedItems, itemId: string) => boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextData | undefined>(undefined);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};

interface UserContextProviderProps {
  children: ReactNode;
}

export const UserContextProvider: React.FC<UserContextProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [unlockedItems, setUnlockedItems] = useState<UnlockedItems>({
    themes: [],
    badges: [],
    music: [],
    features: []
  });
  const [activeTheme, setActiveTheme] = useState<string>('default');
  const [lastDailyPopup, setLastDailyPopup] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Real-time listener for user document changes with better error handling
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          
          // Update unlocked items
          setUnlockedItems(data.unlocked_items || {
            themes: [],
            badges: [],
            music: [],
            features: []
          });
          
          // Update active theme
          setActiveTheme(data.active_theme || 'default');
          
          // Update last daily popup
          setLastDailyPopup(data.last_daily_popup || '');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user document:', error);
        // Don't show error toast for permission issues during initial load
        if (error.code !== 'permission-denied') {
          console.warn('User context listener error:', error.message);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const updateUserContext = (data: Partial<UserContextData>) => {
    if (data.unlockedItems) setUnlockedItems(data.unlockedItems);
    if (data.activeTheme) setActiveTheme(data.activeTheme);
    if (data.lastDailyPopup) setLastDailyPopup(data.lastDailyPopup);
  };

  const hasUnlockedItem = (category: keyof UnlockedItems, itemId: string): boolean => {
    return unlockedItems[category]?.includes(itemId) || false;
  };

  const value: UserContextData = {
    unlockedItems,
    activeTheme,
    lastDailyPopup,
    updateUserContext,
    hasUnlockedItem,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};