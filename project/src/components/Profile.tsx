import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  Award, 
  Calendar, 
  Flame, 
  Star, 
  Coins, 
  Trophy,
  Target,
  TrendingUp,
  Edit3,
  LogOut,
  Globe,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Camera,
  Heart,
  Phone,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserContext } from '../contexts/UserContext';
import BottomNav from './BottomNav';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, userData, logout, updateUserData } = useAuth();
  const { unlockedItems } = useUserContext();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(userData?.displayName || '');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    
    setLoading(true);
    try {
      await updateUserData({ displayName: editName.trim() });
      setShowEditProfile(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const achievements = [
    { 
      id: 1, 
      title: 'First Steps', 
      description: 'Started your journey', 
      icon: '🌱', 
      unlocked: true,
      date: '2024-01-15'
    },
    { 
      id: 2, 
      title: 'Week Warrior', 
      description: '7 days streak', 
      icon: '🔥', 
      unlocked: userData?.streak >= 7,
      date: userData?.streak >= 7 ? '2024-01-22' : null
    },
    { 
      id: 3, 
      title: 'Community Helper', 
      description: 'Helped 10 people', 
      icon: '🤝', 
      unlocked: false,
      date: null
    },
    { 
      id: 4, 
      title: 'Gratitude Master', 
      description: '30 gratitude entries', 
      icon: '🙏', 
      unlocked: false,
      date: null
    },
    { 
      id: 5, 
      title: 'Level 10 Hero', 
      description: 'Reached level 10', 
      icon: '⭐', 
      unlocked: userData?.level >= 10,
      date: userData?.level >= 10 ? '2024-02-01' : null
    },
    { 
      id: 6, 
      title: 'Month Champion', 
      description: '30 days streak', 
      icon: '🏆', 
      unlocked: userData?.streak >= 30,
      date: userData?.streak >= 30 ? '2024-02-15' : null
    },
  ];

  const stats = [
    { 
      label: 'Current Streak', 
      value: `${userData?.streak || 0} days`, 
      icon: Flame, 
      color: 'text-red-500',
      bgColor: 'bg-red-100'
    },
    { 
      label: 'Total XP', 
      value: userData?.xp || 0, 
      icon: Star, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100'
    },
    { 
      label: 'Coins Earned', 
      value: userData?.coins || 0, 
      icon: Coins, 
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    { 
      label: 'Current Level', 
      value: userData?.level || 1, 
      icon: Trophy, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    },
  ];

  const menuItems = [
    { 
      icon: Edit3, 
      label: 'Edit Profile', 
      action: () => setShowEditProfile(true),
      color: 'text-blue-600'
    },
    { 
      icon: Globe, 
      label: 'Language', 
      action: () => toast.info('Language settings coming soon!'),
      color: 'text-green-600'
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      action: () => toast.info('Notification settings coming soon!'),
      color: 'text-yellow-600'
    },
    { 
      icon: Shield, 
      label: 'Privacy & Security', 
      action: () => toast.info('Privacy settings coming soon!'),
      color: 'text-purple-600'
    },
    { 
      icon: HelpCircle, 
      label: 'Help & Support', 
      action: () => toast.info('Help center coming soon!'),
      color: 'text-indigo-600'
    },
  ];

  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const joinDate = new Date(userData.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  // Count unlocked items
  const totalUnlockedItems = Object.values(unlockedItems).reduce((total, items) => total + items.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-4 py-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Profile Picture */}
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                <span className="text-3xl font-bold text-indigo-600">
                  {userData.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <button className="absolute bottom-0 right-1/2 transform translate-x-8 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* User Info */}
            <h1 className="text-2xl font-bold text-white mb-1">{userData.displayName}</h1>
            <p className="text-indigo-200 text-sm mb-2">{currentUser?.email}</p>
            <div className="flex items-center justify-center space-x-4 text-indigo-200 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {joinDate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award className="w-4 h-4" />
                <span>Level {userData.level}</span>
              </div>
            </div>
            
            {/* Unlocked Items Count */}
            {totalUnlockedItems > 0 && (
              <div className="mt-3 bg-white bg-opacity-20 rounded-full px-4 py-2 inline-block">
                <span className="text-white text-sm font-medium">
                  🎁 {totalUnlockedItems} items unlocked
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg p-6 border border-green-200"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">আমাদের সাপোর্ট করুন</h2>
              <p className="text-green-700 text-sm">Support Our Mission</p>
            </div>
          </div>
          
          <p className="text-gray-700 text-sm mb-4 leading-relaxed">
            আমাদের এই যাত্রাকে সচল রাখতে এবং অন্যদের সাহায্য করতে আপনার সহায়তার প্রয়োজন। 
            অল্প দানও একটি বড় পরিবর্তন আনতে পারে।
          </p>
          
          <div className="space-y-3">
            {/* bKash */}
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-pink-600" />
                  <span className="font-medium text-gray-800">bKash</span>
                </div>
                <button
                  onClick={() => copyToClipboard('01712345678')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 text-sm font-mono">01712345678</p>
              <p className="text-xs text-gray-500 mt-1">Personal Number</p>
            </div>
            
            {/* Nagad */}
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-gray-800">Nagad</span>
                </div>
                <button
                  onClick={() => copyToClipboard('01712345678')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 text-sm font-mono">01712345678</p>
              <p className="text-xs text-gray-500 mt-1">Personal Number</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-green-800 text-xs text-center">
              💚 আপনার প্রতিটি অবদান আমাদের কমিউনিটিকে আরও শক্তিশালী করে তোলে
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">Your Progress</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">Achievements</h2>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.05 }}
                className={`p-3 rounded-xl text-center transition-all ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300'
                    : 'bg-gray-100 border-2 border-gray-200'
                }`}
              >
                <div className={`text-2xl mb-1 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                <div className={`text-xs font-medium ${achievement.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                  {achievement.title}
                </div>
                {achievement.unlocked && achievement.date && (
                  <div className="text-xs text-gray-500 mt-1">{achievement.date}</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">Settings</h2>
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={item.action}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-4 rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </motion.button>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <User className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdateProfile}
                  disabled={!editName.trim() || loading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;