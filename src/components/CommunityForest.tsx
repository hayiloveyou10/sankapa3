import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TreePine, User, Calendar, ArrowLeft } from 'lucide-react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';

interface Tree {
  id: string;
  planterUsername: string;
  plantedAt: any;
  treeType: string;
}

const CommunityForest: React.FC = () => {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [hoveredTree, setHoveredTree] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'communityForest'), orderBy('plantedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const treesData: Tree[] = [];
      querySnapshot.forEach((doc) => {
        treesData.push({ id: doc.id, ...doc.data() } as Tree);
      });
      setTrees(treesData);
    });

    return unsubscribe;
  }, []);

  const getTreeSVG = (treeType: string, index: number) => {
    const colors = [
      '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
      '#84cc16', '#65a30d', '#4d7c0f', '#365314', '#1a2e05'
    ];
    const color = colors[index % colors.length];

    switch (treeType) {
      case 'oak':
        return (
          <svg width="60" height="80" viewBox="0 0 60 80">
            <rect x="25" y="50" width="10" height="30" fill="#8b4513" />
            <circle cx="30" cy="35" r="20" fill={color} />
            <circle cx="20" cy="30" r="15" fill={color} />
            <circle cx="40" cy="30" r="15" fill={color} />
          </svg>
        );
      case 'pine':
        return (
          <svg width="60" height="80" viewBox="0 0 60 80">
            <rect x="27" y="60" width="6" height="20" fill="#8b4513" />
            <polygon points="30,10 15,35 45,35" fill={color} />
            <polygon points="30,25 18,45 42,45" fill={color} />
            <polygon points="30,40 20,60 40,60" fill={color} />
          </svg>
        );
      default:
        return (
          <svg width="60" height="80" viewBox="0 0 60 80">
            <rect x="25" y="55" width="10" height="25" fill="#8b4513" />
            <ellipse cx="30" cy="40" rx="18" ry="25" fill={color} />
          </svg>
        );
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">কমিউনিটি বন</h1>
              <p className="text-green-100">Community Forest</p>
            </div>
          </div>
          <p className="text-green-100 text-sm">
            প্রতিটি গাছ একজন সদস্যের অবদানের প্রতীক
          </p>
        </div>
      </div>

      {/* Forest Stats */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">{trees.length}</div>
              <div className="text-sm text-gray-600">মোট গাছ</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{new Set(trees.map(t => t.planterUsername)).size}</div>
              <div className="text-sm text-gray-600">অবদানকারী</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{Math.floor(trees.length * 0.5)}</div>
              <div className="text-sm text-gray-600">CO₂ সাশ্রয় (কেজি)</div>
            </div>
          </div>
        </motion.div>

        {/* Forest Landscape */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-sky-200 to-green-200 rounded-xl shadow-lg p-8 min-h-96 relative overflow-hidden"
        >
          {/* Sky and clouds */}
          <div className="absolute top-4 left-8 w-16 h-8 bg-white rounded-full opacity-70"></div>
          <div className="absolute top-6 right-12 w-12 h-6 bg-white rounded-full opacity-60"></div>
          <div className="absolute top-8 left-1/3 w-20 h-10 bg-white rounded-full opacity-50"></div>

          {/* Sun */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-yellow-400 rounded-full shadow-lg"></div>

          {/* Trees Grid */}
          {trees.length === 0 ? (
            <div className="text-center py-16">
              <TreePine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">এখনো কোনো গাছ নেই</h3>
              <p className="text-gray-500">প্রথম গাছ লাগানোর জন্য রিওয়ার্ড স্টোর দেখুন!</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 pt-8">
              {trees.map((tree, index) => (
                <motion.div
                  key={tree.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative cursor-pointer transform hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoveredTree(tree.id)}
                  onMouseLeave={() => setHoveredTree(null)}
                >
                  {getTreeSVG(tree.treeType, index)}
                  
                  {/* Hover tooltip */}
                  {hoveredTree === tree.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="w-3 h-3" />
                        <span>{tree.planterUsername}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(tree.plantedAt)}</span>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-green-400 to-transparent"></div>
        </motion.div>

        {/* Impact Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6"
        >
          <h3 className="text-lg font-bold text-green-800 mb-2">আমাদের প্রভাব</h3>
          <p className="text-green-700 text-sm leading-relaxed">
            প্রতিটি ভার্চুয়াল গাছ আমাদের বাস্তব বৃক্ষরোপণ কর্মসূচিতে অবদান রাখে। 
            আপনার অংশগ্রহণ পরিবেশ রক্ষায় সাহায্য করছে এবং ভবিষ্যৎ প্রজন্মের জন্য 
            একটি সবুজ পৃথিবী গড়ে তুলছে।
          </p>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CommunityForest;