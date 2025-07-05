import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp } from 'lucide-react';
import { getBadgeForStreak, getNextBadgeInfo, calculateStreakDays } from '../utils/badgeSystem';

interface BadgeDisplayProps {
  streakStartDate: any;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ streakStartDate }) => {
  const streakDays = calculateStreakDays(streakStartDate);
  const currentBadge = getBadgeForStreak(streakDays);
  const { nextBadge, daysRemaining } = getNextBadgeInfo(streakDays);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="text-center">
        {/* Current Badge Display */}
        <div className="relative mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-32 h-32 mx-auto mb-4 relative"
          >
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
              <img 
                src={currentBadge.imageUrl} 
                alt={currentBadge.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to a default image if badge image fails to load
                  (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop';
                }}
              />
            </div>
            
            {/* Badge Level Indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-bold shadow-lg"
            >
              {currentBadge.name}
            </motion.div>
          </motion.div>
        </div>
        
        {/* Badge Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-2">{currentBadge.name}</h3>
          <p className="text-gray-600 text-sm mb-4">{currentBadge.description}</p>
          
          {/* Current Streak Display */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-800">Current Streak: {streakDays} days</span>
            </div>
          </div>
        </motion.div>
        
        {/* Next Badge Progress */}
        {nextBadge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200"
          >
            <div className="flex items-center justify-center space-x-2 mb-3">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Next Badge</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-300">
                <img 
                  src={nextBadge.imageUrl} 
                  alt={nextBadge.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop';
                  }}
                />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-purple-800 text-sm">{nextBadge.name}</h4>
                <p className="text-purple-600 text-xs">
                  {daysRemaining} more day{daysRemaining !== 1 ? 's' : ''} to unlock
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-purple-200 rounded-full h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min(100, (streakDays / nextBadge.minDays) * 100)}%` 
                  }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs text-purple-600 mt-1">
                <span>{streakDays} days</span>
                <span>{nextBadge.minDays} days</span>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Max Level Achieved */}
        {!nextBadge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-300"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-yellow-800">Maximum Level Achieved!</span>
            </div>
            <p className="text-yellow-700 text-sm">
              You've reached the highest badge level. Keep maintaining your streak!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BadgeDisplay;