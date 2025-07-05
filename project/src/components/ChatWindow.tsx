import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Send, 
  Smile, 
  ArrowLeft,
  MoreVertical
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import toast from 'react-hot-toast';
import { getOrCreateChat } from '../utils/chatLogic';
import { BADGE_PROGRESSION } from '../utils/badgeSystem';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  type: 'text' | 'emoji';
}

interface ChatUser {
  id: string;
  displayName: string;
  level: number;
  currentBadge?: string;
  isOnline?: boolean;
}

interface ChatWindowProps {
  user: ChatUser;
  currentUser: User | null;
  onClose: () => void;
}

const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💪', '🙏', '✨', '🌟'];

const ChatWindow: React.FC<ChatWindowProps> = ({ user, currentUser, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatId = currentUser ? [currentUser.uid, user.id].sort().join('_') : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUser || !chatId) return;

    const setupMessageListener = async () => {
      try {
        await getOrCreateChat(user.id, currentUser, user.displayName);
        
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messagesData: ChatMessage[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            messagesData.push({ 
              id: doc.id, 
              ...data,
              timestamp: data.timestamp || new Date()
            } as ChatMessage);
          });
          setMessages(messagesData);
        }, (error) => {
          console.error('Error listening to messages:', error);
          toast.error('Failed to load messages');
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up message listener:', error);
        toast.error('Failed to initialize chat');
      }
    };

    const unsubscribePromise = setupMessageListener();

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, [currentUser, chatId, user.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !chatId) return;

    setLoading(true);
    try {
      await getOrCreateChat(user.id, currentUser, user.displayName);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      await addDoc(messagesRef, {
        content: newMessage.trim(),
        senderId: currentUser.uid,
        receiverId: user.id,
        timestamp: serverTimestamp(),
        type: 'text'
      });
      
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: newMessage.trim(),
        lastMessageTimestamp: serverTimestamp(),
        participantNames: {
          [currentUser.uid]: currentUser.displayName || 'Unknown',
          [user.id]: user.displayName
        }
      });
      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmoji = async (emoji: string) => {
    if (!currentUser || !chatId) return;
    try {
      await getOrCreateChat(user.id, currentUser, user.displayName);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      await addDoc(messagesRef, {
        content: emoji,
        senderId: currentUser.uid,
        receiverId: user.id,
        timestamp: serverTimestamp(),
        type: 'emoji'
      });

      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: emoji,
        lastMessageTimestamp: serverTimestamp(),
        participantNames: {
          [currentUser.uid]: currentUser.displayName || 'Unknown',
          [user.id]: user.displayName
        }
      });
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending emoji:', error);
      toast.error('Failed to send emoji');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '';
    }
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- সঠিক ব্যাজ লজিক ---
  const badgeInfo = BADGE_PROGRESSION.find(b => b.id === (user.currentBadge || 'clown'));
  const badgeImageUrl = badgeInfo ? badgeInfo.imageUrl : '/1.png';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="bg-white rounded-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                <img 
                  src={badgeImageUrl}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/1.png';
                  }}
                />
              </div>
              {user.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold">{user.displayName}</h3>
              <p className="text-xs opacity-80">
                {user.isOnline ? 'Online' : 'Offline'} • Level {user.level}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-gray-500 text-sm">Start a conversation with {user.displayName}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === currentUser?.uid;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isOwn 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}>
                    {message.type === 'emoji' ? (
                      <span className="text-2xl">{message.content}</span>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p className={`text-xs mt-1 text-right ${
                      isOwn ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border-t border-gray-200 p-4"
          >
            <div className="grid grid-cols-5 gap-2">
              {emojis.map((emoji, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSendEmoji(emoji)}
                  className="text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-h-20"
                rows={1}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatWindow;