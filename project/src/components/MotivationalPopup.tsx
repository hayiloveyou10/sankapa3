import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, Heart, Sunrise } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface MotivationalPopupProps {
  onClose: () => void;
}

const MotivationalPopup: React.FC<MotivationalPopupProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const getMotivationalContent = () => {
    const language = i18n.language;
    
    if (language === 'bn' || language === 'ur') {
      return {
        quote: language === 'bn' 
          ? "তোমাদের মধ্যে সর্বোত্তম ঐ ব্যক্তি, যে ব্যক্তি নিজ চরিত্রকে সর্বোৎকৃষ্ট হিসেবে গঠন করে।"
          : "تم میں سے بہترین وہ شخص ہے جو اپنے کردار کو بہترین بناتا ہے۔",
        source: language === 'bn' ? "- (বুখারী ও মুসলিম)" : "- (بخاری و مسلم)",
        donationMessage: language === 'bn'
          ? "আমাদের এই যাত্রাকে সচল রাখতে এবং অন্যদের সাহায্য করতে আপনার সহায়তার প্রয়োজন। অল্প দানও একটি বড় পরিবর্তন আনতে পারে।"
          : "ہمارے اس سفر کو جاری رکھنے اور دوسروں کی مدد کے لیے آپ کی مدد درکار ہے۔ تھوڑا سا عطیہ بھی بڑی تبدیلی لا سکتا ہے۔",
        buttonText: language === 'bn' ? "সহায়তা করুন" : "مدد کریں"
      };
    } else {
      return {
        quote: "The best of people are those who benefit others and strive for excellence in character.",
        source: "- Universal Wisdom",
        donationMessage: "Help us keep this journey alive and support others on their path. Even a small contribution can make a big difference.",
        buttonText: "Support Us"
      };
    }
  };

  const content = getMotivationalContent();

  const handleDonate = async () => {
    setLoading(true);
    try {
      // Mark that user has seen today's popup
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          last_daily_popup: new Date().toDateString()
        });
      }
      
      // Navigate to profile page
      navigate('/profile');
      onClose();
    } catch (error) {
      console.error('Error updating popup status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      // Mark that user has seen today's popup
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          last_daily_popup: new Date().toDateString()
        });
      }
      onClose();
    } catch (error) {
      console.error('Error updating popup status:', error);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header with Close Button */}
        <div className="relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Hero Image */}
          <div className="relative h-48 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-t-3xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative z-10"
            >
              <Sunrise className="w-16 h-16 text-white drop-shadow-lg" />
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute top-8 left-8 w-4 h-4 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-12 right-12 w-6 h-6 bg-white bg-opacity-20 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-16 right-8 w-3 h-3 bg-white bg-opacity-40 rounded-full animate-pulse delay-500"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {i18n.language === 'bn' ? 'শুভ সকাল!' : 
               i18n.language === 'ur' ? 'صبح بخیر!' : 
               'Good Morning!'}
            </h1>
            <p className="text-gray-600 text-sm">
              {i18n.language === 'bn' ? 'আজকের জন্য একটি অনুপ্রেরণামূলক বার্তা' :
               i18n.language === 'ur' ? 'آج کے لیے ایک متاثر کن پیغام' :
               'An inspiring message for today'}
            </p>
          </motion.div>

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border-l-4 border-indigo-500"
          >
            <blockquote className="text-gray-800 text-lg leading-relaxed mb-3 font-medium">
              "{content.quote}"
            </blockquote>
            <cite className="text-indigo-600 text-sm font-medium">
              {content.source}
            </cite>
          </motion.div>

          {/* Donation Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                {i18n.language === 'bn' ? 'আমাদের সাহায্য করুন' :
                 i18n.language === 'ur' ? 'ہماری مدد کریں' :
                 'Help Us'}
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm">
              {content.donationMessage}
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDonate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Heart className="w-5 h-5" />
              <span>{loading ? 'Loading...' : content.buttonText}</span>
            </motion.button>
            
            <button
              onClick={handleClose}
              className="w-full text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              {i18n.language === 'bn' ? 'পরে দেখব' :
               i18n.language === 'ur' ? 'بعد میں دیکھوں گا' :
               'Maybe Later'}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default MotivationalPopup;