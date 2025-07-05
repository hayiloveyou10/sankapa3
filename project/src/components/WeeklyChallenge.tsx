import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Coins, 
  Calendar, 
  Trophy, 
  X, 
  Clock,
  CheckCircle,
  AlertCircle,
  Flame,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserContext } from '../contexts/UserContext';
import { runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import RelapseModal from './RelapseModal';

interface WeeklyChallengeProps {
  embedded?: boolean;
}

interface ActiveStake {
  stakeAmount: number;
  rewardAmount: number;
  startDate: any;
  endDate: any;
  isActive: boolean;
}

const WeeklyChallenge: React.FC<WeeklyChallengeProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const { currentUser, userData, updateUserData } = useAuth();
  const { activeTheme } = useUserContext();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loseLoading, setLoseLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const activeStake: ActiveStake | null = userData?.active_stake || null;
  const canAffordStake = (userData?.coins || 0) >= 100;

  // Calculate time remaining for active stake
  useEffect(() => {
    if (!activeStake?.isActive) return;

    const updateTimer = () => {
      const now = new Date();
      const endDate = activeStake.endDate?.toDate?.() || new Date(activeStake.endDate);
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Challenge Ended');
        checkStakeOutcome();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [activeStake]);

  const checkStakeOutcome = async () => {
    if (!currentUser || !activeStake?.isActive || !userData) return;

    try {
      const now = new Date();
      const endDate = activeStake.endDate?.toDate?.() || new Date(activeStake.endDate);
      
      if (now >= endDate) {
        // Check if user maintained their streak
        const streakMaintained = userData.streak >= 7; // Assuming 7-day challenge
        
        if (streakMaintained) {
          // Award the reward
          await updateUserData({
            coins: userData.coins + activeStake.rewardAmount,
            active_stake: null
          });
          toast.success(`🎉 Challenge completed! You earned ${activeStake.rewardAmount} coins!`, {
            duration: 5000
          });
        } else {
          // Stake lost
          await updateUserData({
            active_stake: null
          });
          toast.error('Challenge failed. Better luck next time!', {
            duration: 4000
          });
        }
      }
    } catch (error) {
      console.error('Error checking stake outcome:', error);
    }
  };

  const handleStartChallenge = async () => {
    if (!currentUser || !userData || !canAffordStake) return;

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User document does not exist');
        }

        const currentCoins = userDoc.data().coins || 0;
        
        if (currentCoins < 100) {
          throw new Error('Insufficient coins');
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7); // 7-day challenge

        const stakeData: ActiveStake = {
          stakeAmount: 100,
          rewardAmount: 150,
          startDate,
          endDate,
          isActive: true
        };

        transaction.update(userRef, {
          coins: currentCoins - 100,
          active_stake: stakeData
        });
      });

      // Update local state
      await updateUserData({
        coins: userData.coins - 100
      });

      setShowConfirmModal(false);
      toast.success('Weekly challenge started! Good luck! 🍀');
    } catch (error) {
      console.error('Error starting challenge:', error);
      toast.error('Failed to start challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoseChallenge = async () => {
    if (!currentUser || !userData || !activeStake?.isActive) return;

    setLoseLoading(true);
    try {
      const updateData: any = {
        streakStartDate: serverTimestamp(),
        streak: 0,
        currentBadge: 'clown', // Reset badge to initial state
        active_stake: {
          ...activeStake,
          isActive: false
        }
      };

      await updateUserData(updateData);
      
      setShowLoseModal(false);
      toast.error('চ্যালেঞ্জ বাতিল হয়ে গেছে এবং নতুন যাত্রা শুরু হয়েছে।', { duration: 5000 });
    } catch (error) {
      console.error('Error losing challenge:', error);
      toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setLoseLoading(false);
    }
  };

  const getThemeStyles = () => {
    switch (activeTheme) {
      case 'ocean-theme':
        return {
          cardBg: 'bg-gradient-to-br from-blue-100 to-cyan-50',
          accent: 'from-blue-500 to-cyan-600',
          border: 'border-blue-200'
        };
      default:
        return {
          cardBg: 'bg-white',
          accent: 'from-indigo-500 to-purple-600',
          border: 'border-gray-200'
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${themeStyles.cardBg} rounded-xl shadow-lg p-6 border ${themeStyles.border}`}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${themeStyles.accent} rounded-full flex items-center justify-center`}>
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">সাপ্তাহিক চ্যালেঞ্জ</h2>
            <p className="text-gray-600 text-sm">Weekly Challenge</p>
          </div>
        </div>

        {activeStake?.isActive ? (
          <div className="space-y-4">
            {/* Active Challenge Status */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Challenge Active</span>
              </div>
              <p className="text-green-700 text-sm mb-3">
                Keep your streak for {timeRemaining} to win {activeStake.rewardAmount} coins!
              </p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="font-bold text-gray-800">{activeStake.stakeAmount}</div>
                  <div className="text-gray-500">Coins Staked</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="font-bold text-green-600">{activeStake.rewardAmount}</div>
                  <div className="text-gray-500">Potential Reward</div>
                </div>
              </div>
            </div>

            {/* Current Streak Display */}
            <div className="flex items-center justify-center space-x-2 p-4 bg-orange-50 rounded-xl">
              <Flame className="w-6 h-6 text-orange-500" />
              <span className="text-lg font-bold text-orange-700">
                {userData?.streak || 0} Day Streak
              </span>
            </div>

            {/* Lose Challenge Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLoseModal(true)}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>আমি চ্যালেঞ্জটি হেরে গিয়েছি</span>
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Challenge Description */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm leading-relaxed mb-3">
                আপনার ১০০ কয়েন বাজি রেখে ৭ দিনের একটি নতুন যাত্রা শুরু করুন। 
                সফল হলে ১৫০ কয়েন পুরস্কার জিতুন!
              </p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Coins className="w-4 h-4 text-yellow-600" />
                    <span className="font-bold text-gray-800">100</span>
                  </div>
                  <div className="text-gray-500">Stake Amount</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Trophy className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-green-600">150</span>
                  </div>
                  <div className="text-gray-500">Reward</div>
                </div>
              </div>
            </div>

            {/* Challenge Rules */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Maintain your streak for 7 consecutive days</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Complete daily check-ins</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Win 150 coins if successful</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Lose 100 coins if you break the streak</span>
              </div>
            </div>

            {/* Start Challenge Button */}
            <motion.button
              whileHover={{ scale: canAffordStake ? 1.02 : 1 }}
              whileTap={{ scale: canAffordStake ? 0.98 : 1 }}
              onClick={() => setShowConfirmModal(true)}
              disabled={!canAffordStake}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                canAffordStake
                  ? `bg-gradient-to-r ${themeStyles.accent} text-white hover:shadow-lg`
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {canAffordStake ? (
                <div className="flex items-center justify-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <span>১০০ কয়েন দিয়ে চ্যালেঞ্জ শুরু করুন</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>অপর্যাপ্ত কয়েন (১০০ প্রয়োজন)</span>
                </div>
              )}
            </motion.button>

            {!canAffordStake && (
              <p className="text-center text-xs text-red-500">
                আরও {100 - (userData?.coins || 0)} কয়েন প্রয়োজন
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Start Challenge Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">চ্যালেঞ্জ নিশ্চিত করুন</h2>
                <p className="text-gray-600 text-sm">
                  আপনি কি ৭ দিনের চ্যালেঞ্জ শুরু করতে চান?
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stake Amount:</span>
                    <div className="flex items-center space-x-1">
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span className="font-bold">100 coins</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Potential Reward:</span>
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-green-600">150 coins</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="font-bold">7 days</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 text-sm font-medium mb-1">Important:</p>
                    <p className="text-yellow-700 text-xs">
                      If you break your streak during the 7-day period, you will lose your 100 coins. 
                      Make sure you're ready for the commitment!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  বাতিল
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartChallenge}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'শুরু করা হচ্ছে...' : 'চ্যালেঞ্জ শুরু করুন'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lose Challenge Confirmation Modal */}
      <RelapseModal
        isOpen={showLoseModal}
        onConfirm={handleLoseChallenge}
        onCancel={() => setShowLoseModal(false)}
        loading={loseLoading}
      />
    </div>
  );
};

export default WeeklyChallenge;