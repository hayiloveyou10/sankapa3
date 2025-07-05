import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      community: 'Community',
      rewards: 'Rewards',
      profile: 'Profile',
      
      // Authentication
      login: 'Login',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      loginWithGoogle: 'Login with Google',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      
      // Dashboard
      welcomeBack: 'Welcome back',
      currentStreak: 'Current Streak',
      days: 'days',
      hours: 'hours',
      minutes: 'minutes',
      level: 'Level',
      xp: 'XP',
      coins: 'Coins',
      checkIn: 'Daily Check-in',
      urgeHelper: 'Urge Helper',
      gratitudeDiary: 'Gratitude Diary',
      successVault: 'Success Vault',
      
      // Language Selection
      selectLanguage: 'Select Your Language',
      continue: 'Continue',
      
      // Gamification
      levelUp: 'Level Up!',
      xpEarned: 'XP Earned',
      coinsEarned: 'Coins Earned',
      
      // Mental Workout
      mentalWorkout: 'Mental Workout',
      solveThePuzzle: 'Solve this puzzle to strengthen your mind',
      
      // Community
      createPost: 'Create Post',
      upvote: 'Upvote',
      
      // Common
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success'
    }
  },
  bn: {
    translation: {
      // Navigation
      dashboard: 'ড্যাশবোর্ড',
      community: 'কমিউনিটি',
      rewards: 'পুরস্কার',
      profile: 'প্রোফাইল',
      
      // Authentication
      login: 'লগইন',
      signup: 'সাইন আপ',
      email: 'ইমেইল',
      password: 'পাসওয়ার্ড',
      confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
      loginWithGoogle: 'গুগলে লগইন করুন',
      createAccount: 'অ্যাকাউন্ট তৈরি করুন',
      alreadyHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
      dontHaveAccount: 'অ্যাকাউন্ট নেই?',
      
      // Dashboard
      welcomeBack: 'স্বাগতম',
      currentStreak: 'বর্তমান ধারা',
      days: 'দিন',
      hours: 'ঘন্টা',
      minutes: 'মিনিট',
      level: 'লেভেল',
      xp: 'এক্সপি',
      coins: 'কয়েন',
      checkIn: 'দৈনিক চেক-ইন',
      urgeHelper: 'তাড়না সহায়ক',
      gratitudeDiary: 'কৃতজ্ঞতার ডায়েরি',
      successVault: 'সাফল্যের ভান্ডার',
      
      // Language Selection
      selectLanguage: 'আপনার ভাষা নির্বাচন করুন',
      continue: 'চালিয়ে যান',
      
      // Gamification
      levelUp: 'লেভেল আপ!',
      xpEarned: 'এক্সপি অর্জিত',
      coinsEarned: 'কয়েন অর্জিত',
      
      // Mental Workout
      mentalWorkout: 'মানসিক ব্যায়াম',
      solveThePuzzle: 'আপনার মন শক্তিশালী করতে এই ধাঁধা সমাধান করুন',
      
      // Community
      createPost: 'পোস্ট তৈরি করুন',
      upvote: 'আপভোট',
      
      // Common
      close: 'বন্ধ',
      save: 'সংরক্ষণ',
      cancel: 'বাতিল',
      submit: 'জমা দিন',
      loading: 'লোডিং...',
      error: 'ত্রুটি',
      success: 'সফল'
    }
  },
  hi: {
    translation: {
      // Navigation
      dashboard: 'डैशबोर्ड',
      community: 'समुदाय',
      rewards: 'पुरस्कार',
      profile: 'प्रोफ़ाइल',
      
      // Authentication
      login: 'लॉगिन',
      signup: 'साइन अप',
      email: 'ईमेल',
      password: 'पासवर्ड',
      confirmPassword: 'पासवर्ड की पुष्टि करें',
      loginWithGoogle: 'Google से लॉगिन करें',
      createAccount: 'खाता बनाएं',
      alreadyHaveAccount: 'पहले से खाता है?',
      dontHaveAccount: 'खाता नहीं है?',
      
      // Dashboard
      welcomeBack: 'वापसी पर स्वागत',
      currentStreak: 'वर्तमान स्ट्रीक',
      days: 'दिन',
      hours: 'घंटे',
      minutes: 'मिनट',
      level: 'स्तर',
      xp: 'एक्सपी',
      coins: 'सिक्के',
      checkIn: 'दैनिक चेक-इन',
      urgeHelper: 'इच्छा सहायक',
      gratitudeDiary: 'कृतज्ञता डायरी',
      successVault: 'सफलता का खजाना',
      
      // Language Selection
      selectLanguage: 'अपनी भाषा चुनें',
      continue: 'जारी रखें',
      
      // Gamification
      levelUp: 'लेवल अप!',
      xpEarned: 'एक्सपी अर्जित',
      coinsEarned: 'सिक्के अर्जित',
      
      // Mental Workout
      mentalWorkout: 'मानसिक व्यायाम',
      solveThePuzzle: 'अपने मन को मजबूत बनाने के लिए इस पहेली को हल करें',
      
      // Community
      createPost: 'पोस्ट बनाएं',
      upvote: 'अपवोट',
      
      // Common
      close: 'बंद करें',
      save: 'सेव करें',
      cancel: 'रद्द करें',
      submit: 'जमा करें',
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता'
    }
  },
  ur: {
    translation: {
      // Navigation
      dashboard: 'ڈیش بورڈ',
      community: 'کمیونٹی',
      rewards: 'انعامات',
      profile: 'پروفائل',
      
      // Authentication
      login: 'لاگ ان',
      signup: 'سائن اپ',
      email: 'ای میل',
      password: 'پاس ورڈ',
      confirmPassword: 'پاس ورڈ کی تصدیق کریں',
      loginWithGoogle: 'گوگل سے لاگ ان کریں',
      createAccount: 'اکاؤنٹ بنائیں',
      alreadyHaveAccount: 'پہلے سے اکاؤنٹ ہے؟',
      dontHaveAccount: 'اکاؤنٹ نہیں ہے؟',
      
      // Dashboard
      welcomeBack: 'واپسی پر خوش آمدید',
      currentStreak: 'موجودہ سلسلہ',
      days: 'دن',
      hours: 'گھنٹے',
      minutes: 'منٹ',
      level: 'سطح',
      xp: 'ایکس پی',
      coins: 'سکے',
      checkIn: 'روزانہ چیک ان',
      urgeHelper: 'خواہش کا مددگار',
      gratitudeDiary: 'شکر گزاری کی ڈائری',
      successVault: 'کامیابی کا خزانہ',
      
      // Language Selection
      selectLanguage: 'اپنی زبان منتخب کریں',
      continue: 'جari رکھیں',
      
      // Gamification
      levelUp: 'لیول اپ!',
      xpEarned: 'ایکس پی حاصل',
      coinsEarned: 'سکے حاصل',
      
      // Mental Workout
      mentalWorkout: 'ذہنی ورزش',
      solveThePuzzle: 'اپنے دماغ کو مضبوط بنانے کے لیے یہ پہیلی حل کریں',
      
      // Community
      createPost: 'پوسٹ بنائیں',
      upvote: 'اپ ووٹ',
      
      // Common
      close: 'بند کریں',
      save: 'محفوظ کریں',
      cancel: 'منسوخ کریں',
      submit: 'جمع کریں',
      loading: 'لوڈ ہو رہا ہے...',
      error: 'خرابی',
      success: 'کامیابی'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'bn', // Default to Bengali
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;