import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Heart, Award } from 'lucide-react';
import { 
  updateDoc, 
  doc, 
  arrayUnion,
  onSnapshot,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  likes?: string[];
}

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorLevel: number;
  createdAt: any;
  likes: string[];
  commentCount: number;
  category: string;
}

interface UserData {
  displayName: string;
  level: number;
  xp: number;
  coins: number;
}

interface CommentModalProps {
  post: Post;
  currentUser: User | null;
  userData: UserData | null;
  onClose: () => void;
  onCommentAdded?: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ 
  post: initialPost, 
  currentUser, 
  userData, 
  onClose,
  onCommentAdded
}) => {
  const [post, setPost] = useState(initialPost);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen for real-time updates to the post
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'communityPosts', initialPost.id), (doc) => {
      if (doc.exists()) {
        setPost({ id: doc.id, ...doc.data() } as Post);
      }
    });

    return unsubscribe;
  }, [initialPost.id]);

  // Add comment with proper transaction handling
  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser || !userData) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const postRef = doc(db, 'communityPosts', post.id);

      const comment = {
        id: Date.now().toString(),
        content: newComment.trim(),
        authorId: currentUser.uid,
        authorName: userData.displayName,
        createdAt: new Date(),
        likes: []
      };

      // Add comment to post and increment comment count
      batch.update(postRef, {
        comments: arrayUnion(comment),
        commentCount: increment(1)
      });

      // Award coins to commenter
      const userRef = doc(db, 'users', currentUser.uid);
      batch.update(userRef, {
        coins: increment(2)
      });

      await batch.commit();

      setNewComment('');
      toast.success('Comment added! +2 coins');
      
      // Notify parent component about comment addition
      if (onCommentAdded) {
        onCommentAdded();
      }
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // Get comments array safely
  const comments = Array.isArray(post.comments) ? post.comments : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            Comments ({post.commentCount || comments.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Original Post */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {post.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-800 text-sm">{post.authorName}</h4>
                <div className="flex items-center space-x-1">
                  <Award className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-gray-500">L{post.authorLevel}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
            </div>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl px-3 py-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-medium text-gray-800 text-sm">{comment.authorName}</h5>
                      <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 ml-3">
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                      <Heart className="w-3 h-3" />
                      <span className="text-xs">{comment.likes?.length || 0}</span>
                    </button>
                    <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">💬</span>
              </div>
              <p className="text-gray-500 text-sm">No comments yet</p>
              <p className="text-gray-400 text-xs">Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-end space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">
                {userData?.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                rows={2}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddComment}
              disabled={!newComment.trim() || loading}
              className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CommentModal;