import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, MessageSquare, History } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import RelapseHistoryModal from './RelapseHistoryModal';

interface RelapseModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const RelapseModal: React.FC<RelapseModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  loading
}) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [showReasonField, setShowReasonField] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleConfirm = async () => {
    // Save relapse entry to Firestore if reason is provided
    if (showReasonField && reason.trim() && currentUser) {
      try {
        await addDoc(collection(db, 'relapseEntries'), {
          userId: currentUser.uid,
          reason: reason.trim(),
          date: new Date().toDateString(),
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        toast.success('Relapse entry saved');
      } catch (error) {
        console.error('Error saving relapse entry:', error);
        toast.error('Failed to save relapse entry');
      }
    }
    
    // Reset form and call parent confirm handler
    setReason('');
    setShowReasonField(false);
    onConfirm();
  };

  const handleCancel = () => {
    setReason('');
    setShowReasonField(false);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">নতুন করে শুরু?</h2>
            <p className="text-gray-600 text-sm">
              আপনি কি নিশ্চিত যে আপনি নতুন করে শুরু করতে চান?
            </p>
            <p className="text-red-600 text-xs mt-2">
              এটি আপনার বর্তমান স্ট্রিক রিসেট করে দেবে এবং আপনার ব্যাজ 'Clown' এ ফিরে যাবে।
            </p>
          </div>

          {!showReasonField ? (
            <div className="space-y-3">
              {/* History Button */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="w-full flex items-center justify-center space-x-2 bg-blue-100 text-blue-700 py-3 rounded-xl hover:bg-blue-200 transition-colors"
              >
                <History className="w-4 h-4" />
                <span>পূর্বের রিল্যাপ্স দেখুন</span>
              </button>
              
              {/* Add Reason Button */}
              <button
                onClick={() => setShowReasonField(true)}
                className="w-full flex items-center justify-center space-x-2 bg-orange-100 text-orange-700 py-3 rounded-xl hover:bg-orange-200 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>কারণ লিখতে চান?</span>
              </button>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  বাতিল
                </button>
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'রিসেট করা হচ্ছে...' : 'হ্যাঁ, রিসেট করুন'}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Reason Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    কেন আপনি রিসেট করছেন? (ঐচ্ছিক)
                  </label>
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="View History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="আপনার অনুভূতি বা কারণ লিখুন..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  এটি আপনাকে ভবিষ্যতে আরও ভালো করতে সাহায্য করবে
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  বাতিল
                </button>
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'রিসেট করা হচ্ছে...' : 'নিশ্চিত করুন'}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Relapse History Modal */}
      <RelapseHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </>
  );
};

export default RelapseModal;