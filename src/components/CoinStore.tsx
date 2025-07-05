import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Coins, 
  Play, 
  ShoppingCart, 
  Heart, 
  ArrowLeft,
  Clock,
  Gift,
  Star,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { runTransaction, doc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import BottomNav from './BottomNav';

interface DailyAdStats {
  watchCount: number;
  lastWatched: any;
}

const CoinStore: React.FC = () => {
  const { currentUser, userData, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [adStats, setAdStats] = useState<DailyAdStats>({ watchCount: 0, lastWatched: null });
  const [watchingAd, setWatchingAd] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);

  const coinPacks = [
    {
      id: 'pack_1000',
      coins: 1000,
      price: 10,
      currency: '৳',
      popular: false
    },
    {
      id: 'pack_5000',
      coins: 5000,
      price: 40,
      currency: '৳',
      popular: true,
      bonus: 500
    }
  ];

  useEffect(() => {
    if (userData?.dailyAdStats) {
      const stats = userData.dailyAdStats;
      const today = new Date().toDateString();
      const lastWatchedDate = stats.lastWatched?.toDate?.()?.toDateString() || '';
      
      if (lastWatchedDate !== today) {
        // Reset count for new day
        setAdStats({ watchCount: 0, lastWatched: null });
      } else {
        setAdStats(stats);
      }
    }
  }, [userData]);

  const handleWatchAd = async () => {
    if (!currentUser || adStats.watchCount >= 5) return;

    setWatchingAd(true);
    
    // Simulate ad watching
    setTimeout(async () => {
      try {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await transaction.get(userRef);
          
          if (!userDoc.exists()) {
            throw new Error('User document does not exist');
          }

          const currentStats = userDoc.data().dailyAdStats || { watchCount: 0, lastWatched: null };
          const today = new Date().toDateString();
          const lastWatchedDate = currentStats.lastWatched?.toDate?.()?.toDateString() || '';
          
          let newWatchCount = currentStats.watchCount;
          if (lastWatchedDate !== today) {
            newWatchCount = 0; // Reset for new day
          }
          
          if (newWatchCount >= 5) {
            throw new Error('Daily limit reached');
          }

          // Update coins and ad stats atomically
          transaction.update(userRef, {
            coins: increment(50),
            dailyAdStats: {
              watchCount: newWatchCount + 1,
              lastWatched: serverTimestamp()
            }
          });
        });

        // Update local state
        setAdStats(prev => ({
          watchCount: prev.watchCount + 1,
          lastWatched: new Date()
        }));

        await updateUserData({ coins: userData!.coins + 50 });
        toast.success('অভিনন্দন! আপনি ৫০ কয়েন জিতেছেন।', { duration: 4000 });
        
      } catch (error) {
        console.error('Error watching ad:', error);
        toast.error('বিজ্ঞাপন দেখতে সমস্যা হয়েছে');
      } finally {
        setWatchingAd(false);
      }
    }, 3000);
  };

  const handleBuyPack = (pack: any) => {
    setSelectedPack(pack);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPack || !currentUser) return;

    // Simulate payment processing
    toast.success('পেমেন্ট সফল! কয়েন যোগ করা হয়েছে।');
    
    const totalCoins = selectedPack.coins + (selectedPack.bonus || 0);
    await updateUserData({ coins: userData!.coins + totalCoins });
    
    setShowPaymentModal(false);
    setSelectedPack(null);
  };

  const remainingAds = Math.max(0, 5 - adStats.watchCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">সাপোর্ট ও পুরস্কার</h1>
              <p className="text-yellow-100 text-sm">Support & Rewards</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">আপনার বর্তমান কয়েন</h2>
          <div className="text-4xl font-bold text-yellow-600">{userData?.coins || 0}</div>
        </motion.div>

        {/* Rewarded Ad Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">দৈনিক টাস্ক: বিজ্ঞাপন দেখুন</h3>
              <p className="text-gray-600 text-sm">Daily Task: Watch Ads</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-green-800 font-medium">প্রতিটি বিজ্ঞাপনের জন্য জিতুন ৫০ কয়েন</span>
              <div className="flex items-center space-x-1">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-yellow-700">50</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700">আজকের জন্য বাকি:</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-800">{remainingAds}/5</span>
              </div>
            </div>
          </div>

          {watchingAd ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-8 h-8 text-blue-600" />
                </motion.div>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">বিজ্ঞাপন চলছে...</h4>
              <p className="text-gray-600 text-sm">অনুগ্রহ করে অপেক্ষা করুন</p>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: remainingAds > 0 ? 1.02 : 1 }}
              whileTap={{ scale: remainingAds > 0 ? 0.98 : 1 }}
              onClick={handleWatchAd}
              disabled={remainingAds === 0}
              className={`w-full py-4 rounded-xl font-semibold transition-all ${
                remainingAds > 0
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {remainingAds > 0 ? (
                <div className="flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>বিজ্ঞাপন দেখুন</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>আজকের সীমা শেষ</span>
                </div>
              )}
            </motion.button>
          )}
        </motion.div>

        {/* Coin Purchase Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">কয়েন প্যাক কিনুন</h3>
              <p className="text-gray-600 text-sm">Buy Coin Packs</p>
            </div>
          </div>

          <div className="space-y-4">
            {coinPacks.map((pack) => (
              <motion.div
                key={pack.id}
                whileHover={{ scale: 1.02 }}
                className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                  pack.popular 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleBuyPack(pack)}
              >
                {pack.popular && (
                  <div className="flex items-center justify-center mb-2">
                    <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>Best Value!</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Coins className="w-5 h-5 text-yellow-600" />
                      <span className="text-xl font-bold text-gray-800">
                        {pack.coins.toLocaleString()}
                      </span>
                      {pack.bonus && (
                        <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          +{pack.bonus} বোনাস
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">কয়েন</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {pack.currency}{pack.price}
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      কিনুন
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">আমাদের লক্ষ্য</h3>
          </div>
          
          <p className="text-gray-700 text-sm leading-relaxed">
            আপনার প্রতিটি অবদান, তা কয়েন কেনার মাধ্যমে হোক বা বিজ্ঞাপন দেখার মাধ্যমে, 
            'সঙ্কল্প' প্ল্যাটফর্মকে দীর্ঘমেয়াদে সচল রাখতে এবং আমাদের বৃক্ষরোপণ কর্মসূচিতে 
            সাহায্য করে। আপনার সমর্থনের জন্য ধন্যবাদ।
          </p>
        </motion.div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">পেমেন্ট নিশ্চিত করুন</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span>কয়েন:</span>
                <span className="font-bold">{selectedPack.coins.toLocaleString()}</span>
              </div>
              {selectedPack.bonus && (
                <div className="flex items-center justify-between mb-2">
                  <span>বোনাস:</span>
                  <span className="font-bold text-green-600">+{selectedPack.bonus}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2">
                <span>মোট:</span>
                <span className="font-bold text-blue-600">
                  {selectedPack.currency}{selectedPack.price}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>নোট:</strong> এটি একটি ডেমো। বাস্তব পেমেন্ট প্রক্রিয়া এখনো সক্রিয় নয়।
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                বাতিল
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                পেমেন্ট করুন
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CoinStore;