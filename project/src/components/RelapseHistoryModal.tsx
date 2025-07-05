import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MessageSquare, TrendingDown, AlertCircle } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface RelapseEntry {
  id: string;
  reason: string;
  date: string;
  timestamp: any;
  userId: string;
}

interface RelapseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RelapseHistoryModal: React.FC<RelapseHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser } = useAuth();
  const [relapseEntries, setRelapseEntries] = useState<RelapseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !isOpen) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'relapseEntries'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const entries: RelapseEntry[] = [];
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() } as RelapseEntry);
      });
      setRelapseEntries(entries);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching relapse entries:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">রিল্যাপ্স হিস্টরি</h2>
              <p className="text-gray-600 text-sm">Relapse History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading history...</p>
            </div>
          ) : relapseEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">কোনো রিল্যাপ্স নেই!</h3>
              <p className="text-gray-600 text-sm">
                আপনি এখনো কোনো রিল্যাপ্স রেকর্ড করেননি। চালিয়ে যান!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">মোট রিল্যাপ্স: {relapseEntries.length}</span>
                </div>
                <p className="text-red-700 text-sm">
                  প্রতিটি রিল্যাপ্স থেকে শিখুন এবং আরও শক্তিশালী হয়ে ফিরে আসুন।
                </p>
              </div>

              {/* Relapse Entries */}
              {relapseEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{entry.date}</span>
                    <span className="text-xs text-gray-500">
                      #{relapseEntries.length - index}
                    </span>
                  </div>
                  
                  {entry.reason ? (
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 leading-relaxed">{entry.reason}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-500 italic">কোনো কারণ উল্লেখ করা হয়নি</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium"
          >
            বন্ধ করুন
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default RelapseHistoryModal;