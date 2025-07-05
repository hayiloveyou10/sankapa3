import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  Gift, 
  Palette, 
  Award, 
  Smartphone, 
  Heart, 
  Cherry,
  X,
  Sparkles,
  Crown,
  Star,
  TreePine,
  Headphones,
  Check,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserContext } from '../contexts/UserContext';
import { collection, addDoc, runTransaction, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import BottomNav from './BottomNav';

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ComponentType<any>;
  category: 'in-app' | 'real-world';
  type: 'theme' | 'badge' | 'tree-design' | 'recharge' | 'donation' | 'music' | 'feature';
  unlockCategory?: 'themes' | 'badges' | 'music' | 'features';
}

interface RedemptionModalProps {
  reward: Reward;
  userCoins: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const RedemptionModal: React.FC<RedemptionModalProps> = ({ 
  reward, 
  userCoins, 
  onConfirm, 
  onCancel, 
  loading 
}) => {
  const canAfford = userCoins >= reward.cost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <reward.icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">নিশ্চিত করুন</h2>
          <p className="text-gray-600 text-sm">
            আপনি কি নিশ্চিতভাবে এই পুরস্কারটি রিডিম করতে চান?
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-800">{reward.name}</span>
            <div className="flex items-center space-x-1 text-yellow-600">
              <Coins className="w-4 h-4" />
              <span className="font-bold">{reward.cost}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">আপনার বর্তমান কয়েন:</span>
            <div className="flex items-center space-x-1">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-gray-800">{userCoins}</span>
            </div>
          </div>
          
          {canAfford && (
            <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-500">রিডিমের পর অবশিষ্ট:</span>
              <div className="flex items-center space-x-1">
                <Coins className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-600">{userCoins - reward.cost}</span>
              </div>
            </div>
          )}
        </div>

        {!canAfford && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm text-center">
              দুঃখিত! আপনার পর্যাপ্ত কয়েন নেই। আরও {reward.cost - userCoins} কয়েন প্রয়োজন।
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            না
          </button>
          <motion.button
            whileHover={{ scale: canAfford ? 1.02 : 1 }}
            whileTap={{ scale: canAfford ? 0.98 : 1 }}
            onClick={onConfirm}
            disabled={!canAfford || loading}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
              canAfford && !loading
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'প্রক্রিয়াকরণ...' : 'হ্যাঁ, নিশ্চিত'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

interface RewardCardProps {
  reward: Reward;
  userCoins: number;
  onRedeem: (reward: Reward) => void;
  isUnlocked?: boolean;
  isActive?: boolean;
  onActivate?: (reward: Reward) => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ 
  reward, 
  userCoins, 
  onRedeem, 
  isUnlocked = false,
  isActive = false,
  onActivate 
}) => {
  const canAfford = userCoins >= reward.cost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl shadow-lg p-6 border transition-all duration-300 hover:shadow-xl ${
        isUnlocked ? 'border-green-300 bg-green-50' : 'border-gray-100'
      }`}
    >
      {/* Reward Icon/Image */}
      <div className="relative mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
          reward.type === 'theme' ? 'bg-gradient-to-br from-blue-400 to-cyan-500' :
          reward.type === 'badge' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
          reward.type === 'tree-design' ? 'bg-gradient-to-br from-pink-400 to-rose-500' :
          reward.type === 'recharge' ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
          reward.type === 'music' ? 'bg-gradient-to-br from-purple-400 to-indigo-500' :
          'bg-gradient-to-br from-red-400 to-pink-500'
        }`}>
          <reward.icon className="w-8 h-8 text-white" />
        </div>
        
        {/* Status indicators */}
        {isUnlocked && (
          <div className="absolute -top-2 -right-2">
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Unlocked</span>
            </div>
          </div>
        )}
        
        {isActive && (
          <div className="absolute -bottom-2 -right-2">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>Active</span>
            </div>
          </div>
        )}

        {/* Premium indicator for high-value items */}
        {reward.cost >= 5000 && !isUnlocked && (
          <div className="absolute -top-2 -left-2">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <Crown className="w-3 h-3" />
              <span>Premium</span>
            </div>
          </div>
        )}
      </div>

      {/* Reward Details */}
      <div className="text-center mb-4">
        <h3 className="font-bold text-gray-800 mb-2 text-lg">{reward.name}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">{reward.description}</p>
        
        {/* Cost Display */}
        {!isUnlocked && (
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-gray-500 text-sm">মূল্য:</span>
            <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-yellow-700">{reward.cost}</span>
              <span className="text-yellow-600 text-sm">কয়েন</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isUnlocked ? (
        <div className="space-y-2">
          {reward.category === 'in-app' && onActivate && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onActivate(reward)}
              disabled={isActive}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-100 text-blue-700 cursor-default'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isActive ? (
                <div className="flex items-center justify-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>সক্রিয়</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>সক্রিয় করুন</span>
                </div>
              )}
            </motion.button>
          )}
          <div className="bg-green-100 text-green-700 py-2 px-4 rounded-xl text-center text-sm font-medium">
            ✅ আনলক করা হয়েছে
          </div>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: canAfford ? 1.05 : 1 }}
          whileTap={{ scale: canAfford ? 0.95 : 1 }}
          onClick={() => onRedeem(reward)}
          disabled={!canAfford}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            canAfford
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          {canAfford ? (
            <div className="flex items-center justify-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>রিডিম করুন</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Coins className="w-4 h-4" />
              <span>অপর্যাপ্ত কয়েন</span>
            </div>
          )}
        </motion.button>
      )}

      {/* Affordability indicator */}
      {!canAfford && !isUnlocked && (
        <p className="text-center text-xs text-red-500 mt-2">
          আরও {reward.cost - userCoins} কয়েন প্রয়োজন
        </p>
      )}
    </motion.div>
  );
};

const Rewards: React.FC = () => {
  const { t } = useTranslation();
  const { userData, updateUserData, currentUser } = useAuth();
  const { unlockedItems, activeTheme, hasUnlockedItem } = useUserContext();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(false);

  const inAppRewards: Reward[] = [
    {
      id: 'ocean-theme',
      name: 'প্রিমিয়াম ওশেন থিম',
      description: 'আপনার অ্যাপকে একটি শান্ত এবং সুন্দর সমুদ্রের থিম দিন।',
      cost: 500,
      icon: Palette,
      category: 'in-app',
      type: 'theme',
      unlockCategory: 'themes'
    },
    {
      id: 'legendary-badge',
      name: 'লিজেন্ডারি ব্যাজ',
      description: 'আপনার প্রোফাইলে এই বিশেষ ব্যাজটি প্রদর্শন করে আপনার অর্জনকে দেখান।',
      cost: 1500,
      icon: Award,
      category: 'in-app',
      type: 'badge',
      unlockCategory: 'badges'
    },
    {
      id: 'cherry-blossom-tree',
      name: 'চেরি ব্লসম ট্রি',
      description: 'আপনার সঙ্কল্প বৃক্ষটিকে একটি সুন্দর চেরি ব্লসম গাছে পরিণত করুন।',
      cost: 1000,
      icon: Cherry,
      category: 'in-app',
      type: 'tree-design',
      unlockCategory: 'features'
    },
    {
      id: 'focus-music',
      name: 'ফোকাস মোড মিউজিক',
      description: 'অ্যাপ ব্যবহারের সময় শোনার জন্য একটি শান্ত এবং মেডিটেটিভ সাউন্ডট্র্যাক আনলক করুন।',
      cost: 750,
      icon: Headphones,
      category: 'in-app',
      type: 'music',
      unlockCategory: 'music'
    }
  ];

  const realWorldRewards: Reward[] = [
    {
      id: 'mobile-recharge-20',
      name: '২০ টাকা মোবাইল রিচার্জ',
      description: 'আপনার যেকোনো লোকাল অপারেটরে ২০ টাকা রিচার্জ নিন।',
      cost: 5000,
      icon: Smartphone,
      category: 'real-world',
      type: 'recharge'
    },
    {
      id: 'plant-tree',
      name: 'একটি বাস্তব গাছ লাগান',
      description: 'আপনার নামে একটি বাস্তব গাছ লাগানো হবে এবং আপনি তার একটি ডিজিটাল সার্টিফিকেট পাবেন।',
      cost: 10000,
      icon: TreePine,
      category: 'real-world',
      type: 'donation'
    },
    {
      id: 'charity-donation',
      name: '১০ টাকা চ্যারিটিতে দান করুন',
      description: 'আপনার কয়েন ব্যবহার করে কোনো একটি মহৎ উদ্দেশ্যে সাহায্য করুন।',
      cost: 1000,
      icon: Heart,
      category: 'real-world',
      type: 'donation'
    }
  ];

  const handleRedeemReward = async (reward: Reward) => {
    if (!currentUser || !userData) {
      toast.error('Please log in to redeem rewards');
      return;
    }

    if (userData.coins < reward.cost) {
      toast.error('Insufficient coins');
      return;
    }

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User document does not exist');
        }

        const currentCoins = userDoc.data().coins || 0;
        
        if (currentCoins < reward.cost) {
          throw new Error('Insufficient coins');
        }

        // Deduct coins from user
        const updateData: any = {
          coins: currentCoins - reward.cost
        };

        // For in-app rewards, add to unlocked items
        if (reward.category === 'in-app' && reward.unlockCategory) {
          const currentUnlocked = userDoc.data().unlocked_items || {
            themes: [],
            badges: [],
            music: [],
            features: []
          };
          
          if (!currentUnlocked[reward.unlockCategory].includes(reward.id)) {
            currentUnlocked[reward.unlockCategory].push(reward.id);
            updateData.unlocked_items = currentUnlocked;
          }
        }

        transaction.update(userRef, updateData);

        // For real-world rewards, log the redemption request
        if (reward.category === 'real-world') {
          const redemptionRef = doc(collection(db, 'redemptionRequests'));
          transaction.set(redemptionRef, {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: userData.displayName,
            rewardId: reward.id,
            rewardName: reward.name,
            rewardType: reward.type,
            cost: reward.cost,
            status: 'pending',
            createdAt: new Date(),
            processedAt: null,
            notes: ''
          });
        }
      });

      // Update local state
      await updateUserData({
        coins: userData.coins - reward.cost
      });

      setSelectedReward(null);
      
      if (reward.category === 'real-world') {
        toast.success('Redemption request submitted! We will process it within 24 hours.');
      } else {
        toast.success(`${reward.name} has been unlocked!`);
      }

    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTheme = async (reward: Reward) => {
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        active_theme: reward.id
      });
      toast.success(`${reward.name} activated!`);
    } catch (error) {
      console.error('Error activating theme:', error);
      toast.error('Failed to activate theme');
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Gift className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">পুরস্কার কেন্দ্র</h1>
            <p className="text-indigo-200 text-sm">Rewards Center</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* User's Coin Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">আপনার বর্তমান কয়েন</h2>
            <div className="flex items-center justify-center space-x-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="text-4xl font-bold text-yellow-600"
              >
                {userData.coins.toLocaleString()}
              </motion.div>
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Keep completing daily tasks to earn more coins!
            </p>
          </div>
        </motion.div>

        {/* In-App Rewards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Star className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">ইন-অ্যাপ পুরস্কার</h2>
            <span className="text-sm text-gray-500">(In-App Rewards)</span>
          </div>
          
          <div className="grid gap-4">
            {inAppRewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RewardCard
                  reward={reward}
                  userCoins={userData.coins}
                  onRedeem={setSelectedReward}
                  isUnlocked={hasUnlockedItem(reward.unlockCategory!, reward.id)}
                  isActive={reward.type === 'theme' && activeTheme === reward.id}
                  onActivate={reward.type === 'theme' ? handleActivateTheme : undefined}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Real-World Rewards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Gift className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">বাস্তব পুরস্কার</h2>
            <span className="text-sm text-gray-500">(Real-World Rewards)</span>
          </div>
          
          <div className="grid gap-4">
            {realWorldRewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RewardCard
                  reward={reward}
                  userCoins={userData.coins}
                  onRedeem={setSelectedReward}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How to Earn More Coins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>আরও কয়েন অর্জন করুন</span>
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Daily check-in: +5 coins</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Create a post: +3 coins</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Complete mental workout: +10 coins</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Write gratitude entry: +2 coins</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Level up: +50 coins</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Redemption Confirmation Modal */}
      <AnimatePresence>
        {selectedReward && (
          <RedemptionModal
            reward={selectedReward}
            userCoins={userData.coins}
            onConfirm={() => handleRedeemReward(selectedReward)}
            onCancel={() => setSelectedReward(null)}
            loading={loading}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default Rewards;