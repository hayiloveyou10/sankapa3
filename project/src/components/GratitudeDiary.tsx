import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, BookOpen, Save, Calendar } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface GratitudeDiaryProps {
  onClose: () => void;
}

interface DiaryEntry {
  id: string;
  content: string;
  date: string;
  userId: string;
  createdAt: any;
}

const GratitudeDiary: React.FC<GratitudeDiaryProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexError, setIndexError] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // First try with orderBy (requires composite index)
    const qWithOrder = query(
      collection(db, 'diaryEntries'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeWithOrder = onSnapshot(
      qWithOrder,
      (querySnapshot) => {
        const entriesData: DiaryEntry[] = [];
        querySnapshot.forEach((doc) => {
          entriesData.push({ id: doc.id, ...doc.data() } as DiaryEntry);
        });
        setEntries(entriesData);
        setIndexError(false);
      },
      (error) => {
        console.error('Query with orderBy failed:', error);
        if (error.code === 'failed-precondition') {
          setIndexError(true);
          
          // Fallback query without orderBy
          const qWithoutOrder = query(
            collection(db, 'diaryEntries'),
            where('userId', '==', currentUser.uid)
          );

          const unsubscribeWithoutOrder = onSnapshot(qWithoutOrder, (querySnapshot) => {
            const entriesData: DiaryEntry[] = [];
            querySnapshot.forEach((doc) => {
              entriesData.push({ id: doc.id, ...doc.data() } as DiaryEntry);
            });
            
            // Sort manually on the client side
            entriesData.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            });
            
            setEntries(entriesData);
          });

          return unsubscribeWithoutOrder;
        }
      }
    );

    return unsubscribeWithOrder;
  }, [currentUser]);

  const handleSave = async () => {
    if (!content.trim() || !currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'diaryEntries'), {
        content: content.trim(),
        date: new Date().toDateString(),
        userId: currentUser.uid,
        createdAt: new Date(),
      });

      setContent('');
      toast.success('Gratitude entry saved!');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t('gratitudeDiary')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Index Warning */}
        {indexError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> For optimal performance, please create the required database index in your Firebase Console. 
              Entries are currently sorted on the client side.
            </p>
          </div>
        )}

        {/* New Entry Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-3">What are you grateful for today?</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about something you're grateful for..."
            className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex justify-end mt-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={!content.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : t('save')}</span>
            </motion.button>
          </div>
        </div>

        {/* Previous Entries */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Previous Entries</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No entries yet. Start your gratitude journey!</p>
            ) : (
              entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{entry.date}</span>
                  </div>
                  <p className="text-gray-700">{entry.content}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GratitudeDiary;