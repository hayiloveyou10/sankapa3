import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  lastCheckIn: string;
  createdAt: string;
  language: string;
  following?: string[];
  followers?: string[];
  inventory?: any[];
  unlocked_items?: {
    themes: string[];
    badges: string[];
    music: string[];
    features: string[];
  };
  active_theme?: string;
  last_daily_popup?: string;
  active_stake?: any;
  streakStartDate?: any;
  currentBadge?: string; // New field for dynamic badge system
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to convert Firebase error codes to user-friendly messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-credential':
      return 'ভুল ইমেইল বা পাসওয়ার্ড। দয়া করে আবার চেষ্টা করুন।';
    case 'auth/user-not-found':
      return 'এই ইমেইল ঠিকানায় কোনো অ্যাকাউন্ট পাওয়া যায়নি।';
    case 'auth/wrong-password':
      return 'ভুল পাসওয়ার্ড। দয়া করে আবার চেষ্টা করুন।';
    case 'auth/invalid-email':
      return 'দয়া করে একটি বৈধ ইমেইল ঠিকানা লিখুন।';
    case 'auth/user-disabled':
      return 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। সাহায্যের জন্য যোগাযোগ করুন।';
    case 'auth/too-many-requests':
      return 'অনেকবার ভুল চেষ্টা। কিছুক্ষণ পর আবার চেষ্টা করুন।';
    case 'auth/email-already-in-use':
      return 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। লগইন করার চেষ্টা করুন।';
    case 'auth/weak-password':
      return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
    case 'auth/operation-not-allowed':
      return 'এই সাইন-ইন পদ্ধতি সক্রিয় নয়। সাহায্যের জন্য যোগাযোগ করুন।';
    case 'auth/popup-closed-by-user':
      return 'সাইন-ইন বাতিল করা হয়েছে। দয়া করে আবার চেষ্টা করুন।';
    case 'auth/popup-blocked':
      return 'পপ-আপ ব্লক করা হয়েছে। দয়া করে পপ-আপ অনুমতি দিন।';
    case 'auth/network-request-failed':
      return 'নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ চেক করুন।';
    case 'auth/requires-recent-login':
      return 'নিরাপত্তার জন্য আবার লগইন করুন।';
    case 'auth/account-exists-with-different-credential':
      return 'এই ইমেইল দিয়ে অন্য পদ্ধতিতে অ্যাকাউন্ট আছে।';
    default:
      return 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
      } else {
        // If user document doesn't exist, create it
        await createUserData(user, user.displayName || 'User');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('ব্যবহারকারীর তথ্য লোড করতে সমস্যা হয়েছে');
    }
  };

  const createUserData = async (user: User, displayName: string, language: string = 'bn') => {
    try {
      const userData: UserData = {
        uid: user.uid,
        email: user.email || '',
        displayName: displayName || user.displayName || 'User',
        level: 1,
        xp: 0,
        coins: 50, // Starting bonus
        streak: 0,
        lastCheckIn: '',
        createdAt: new Date().toISOString(),
        language,
        following: [],
        followers: [],
        inventory: [],
        unlocked_items: {
          themes: [],
          badges: [],
          music: [],
          features: []
        },
        active_theme: 'default',
        last_daily_popup: '',
        streakStartDate: serverTimestamp(),
        currentBadge: 'clown' // Initialize with default badge
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        lastCheckIn: serverTimestamp(),
        streakStartDate: serverTimestamp()
      });
      
      setUserData(userData);
      toast.success('স্বাগতম! আপনার অ্যাকাউন্ট তৈরি হয়েছে! 🎉');
    } catch (error) {
      console.error('Error creating user data:', error);
      toast.error('ব্যবহারকারীর তথ্য সংরক্ষণে সমস্যা হয়েছে');
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success('স্বাগতম! সফলভাবে লগইন হয়েছে! 🎉');
      return result;
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(result.user, {
        displayName: displayName
      });
      
      // Create user data in Firestore
      await createUserData(result.user, displayName);
      
      return result;
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await createUserData(result.user, result.user.displayName || 'User');
      }
      
      toast.success('Google দিয়ে সফলভাবে লগইন হয়েছে! 🎉');
      return result;
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      toast.success('সফলভাবে লগআউট হয়েছে!');
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!currentUser) return;
    
    try {
      // Check for level up and award coins
      if (data.level && userData && data.level > userData.level) {
        const levelDifference = data.level - userData.level;
        const bonusCoins = levelDifference * 50;
        data.coins = (data.coins || userData.coins) + bonusCoins;
        toast.success(`লেভেল আপ! +${bonusCoins} বোনাস কয়েন! 🎉`, {
          duration: 4000
        });
      }
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'users', currentUser.uid), updateData);
      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating user data:', error);
      toast.error('তথ্য আপডেট করতে সমস্যা হয়েছে');
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          await fetchUserData(user);
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateUserData,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};