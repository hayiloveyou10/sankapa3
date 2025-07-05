import React from 'react';
import { motion } from 'framer-motion';

interface ResolutionTreeProps {
  level: number;
}

const ResolutionTree: React.FC<ResolutionTreeProps> = ({ level }) => {
  const getTreeEmoji = (level: number) => {
    if (level === 1) return '🌱';
    if (level <= 3) return '🌿';
    if (level <= 5) return '🌳';
    if (level <= 8) return '🌲';
    if (level <= 10) return '🌴';
    return '🌺';
  };

  const getTreeDescription = (level: number) => {
    if (level === 1) return 'A small seed of determination has been planted';
    if (level <= 3) return 'Your resolve is sprouting into a young sapling';
    if (level <= 5) return 'A strong tree grows from your commitment';
    if (level <= 8) return 'Your dedication has grown into a mighty tree';
    if (level <= 10) return 'A towering tree of self-discipline stands tall';
    return 'Your resolution has blossomed into beautiful flowers';
  };

  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1
        }}
        className="relative"
      >
        <div className="text-8xl mb-4 filter drop-shadow-lg">
          {getTreeEmoji(level)}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h3 className="text-xl font-bold text-gray-800">Level {level}</h3>
          <p className="text-gray-600 max-w-sm mx-auto text-sm">
            {getTreeDescription(level)}
          </p>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(level)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="absolute text-yellow-400"
              style={{
                left: `${20 + (i * 15) % 60}%`,
                top: `${10 + (i * 20) % 80}%`,
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ResolutionTree;