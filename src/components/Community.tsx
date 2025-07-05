import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  Users, 
  TrendingUp,
  Clock,
  Award,
  Send,
  X,
  Search,
  Filter,
  MessageSquare,
  UserPlus,
  UserCheck,
  Smile,
  Pin,
  Trophy,
  Crown,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserContext } from '../contexts/UserContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  where,
  limit,
  getDocs,
  writeBatch,
  increment,
  Timestamp,
  setDoc,
  getDoc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import BottomNav from './BottomNav';
import ChatWindow from './ChatWindow';
import CommentModal from './CommentModal';
import { getBadgeForStreak, BADGE_PROGRESSION } from '../utils/badgeSystem';

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorLevel: number;
  authorBadges: string[];
  authorCurrentBadge?: string;
  createdAt: any;
  likes: string[];
  commentCount: number;
  category: 'motivation' | 'success' | 'support' | 'general';
  relevanceScore?: number;
  isPinned?: boolean; // NEW for Community Hero feature
  heroAwards?: string[]; // NEW for Hero Awards
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

interface User {
  id: string;
  displayName: string;
  level: number;
  currentBadge?: string;
  isOnline?: boolean;
  lastSeen?: any;
  following?: string[];
  followers?: string[];
  isCommunityHero?: boolean; // NEW
  heroStatusExpiresAt?: any; // NEW
}

const Community: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, userData, updateUserData } = useAuth();
  const { unlockedItems } = useUserContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Post['category']>('general');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'chat'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState<'relevant' | 'recent' | 'following'>('relevant');
  const [userCommentCount, setUserCommentCount] = useState(0);

  const categories = [
    { value: 'motivation', label: 'অনুপ্রেরণা', emoji: '💪', color: 'bg-blue-100 text-blue-800' },
    { value: 'success', label: 'সাফল্য', emoji: '🎉', color: 'bg-green-100 text-green-800' },
    { value: 'support', label: 'সহায়তা', emoji: '🤝', color: 'bg-purple-100 text-purple-800' },
    { value: 'general', label: 'সাধারণ', emoji: '💬', color: 'bg-gray-100 text-gray-800' },
  ];

  // Helper function to get badge image URL
  const getBadgeImageUrl = (badgeId: string): string => {
    const badge = BADGE_PROGRESSION.find(b => b.id === badgeId);
    return badge?.imageUrl || '/1.png';
  };

  // Check if current user is Community Hero
  const isCurrentUserHero = (): boolean => {
    if (!userData?.isCommunityHero) return false;
    if (!userData?.heroStatusExpiresAt) return false;
    
    const now = new Date();
    const expiresAt = userData.heroStatusExpiresAt.toDate ? userData.heroStatusExpiresAt.toDate() : new Date(userData.heroStatusExpiresAt);
    
    return now < expiresAt;
  };

  // Calculate recency score (newer posts get higher scores)
  const calculateRecencyScore = (createdAt: any): number => {
    const now = new Date();
    const postDate = createdAt?.toDate?.() || new Date(createdAt);
    const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, 24 - hoursDiff);
  };

  // Check if current user is following a specific user
  const isFollowing = (authorId: string): boolean => {
    return userData?.following?.includes(authorId) || false;
  };

  // Calculate relevance score for feed ranking
  const calculateRelevanceScore = (post: Post): number => {
    const likeScore = (post.likes?.length || 0) * 2;
    const commentScore = (post.commentCount || 0) * 3;
    const followBonus = isFollowing(post.authorId) ? 10 : 0;
    const recencyScore = calculateRecencyScore(post.createdAt);
    const pinnedBonus = post.isPinned ? 100 : 0; // Pinned posts get highest priority
    const heroAwardBonus = (post.heroAwards?.length || 0) * 5;
    
    return likeScore + commentScore + followBonus + recencyScore + pinnedBonus + heroAwardBonus;
  };

  // Fetch and rank posts
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, 'communityPosts'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        const postData = { id: doc.id, ...doc.data() } as Post;
        postData.relevanceScore = calculateRelevanceScore(postData);
        postsData.push(postData);
      });

      // Sort posts based on selected filter
      let sortedPosts = [...postsData];
      if (feedFilter === 'relevant') {
        sortedPosts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      } else if (feedFilter === 'recent') {
        sortedPosts.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      } else if (feedFilter === 'following') {
        const followingPosts = sortedPosts.filter(post => isFollowing(post.authorId));
        const otherPosts = sortedPosts.filter(post => !isFollowing(post.authorId));
        sortedPosts = [
          ...followingPosts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)),
          ...otherPosts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        ];
      }

      setPosts(sortedPosts);
    });

    return unsubscribe;
  }, [feedFilter, userData?.following]);

  // Fetch users for chat and follow functionality
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(100));
        const querySnapshot = await getDocs(q);
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          if (doc.id !== currentUser?.uid) {
            usersData.push({
              id: doc.id,
              displayName: userData.displayName || 'Unknown User',
              level: userData.level || 1,
              currentBadge: userData.currentBadge || 'clown',
              isOnline: userData.isOnline || false,
              lastSeen: userData.lastSeen,
              following: userData.following || [],
              followers: userData.followers || [],
              isCommunityHero: userData.isCommunityHero || false,
              heroStatusExpiresAt: userData.heroStatusExpiresAt
            });
          }
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !currentUser || !userData) return;

    setLoading(true);
    try {
      const currentBadges = unlockedItems.badges || [];
      const currentBadge = userData.currentBadge || 'clown';

      await addDoc(collection(db, 'communityPosts'), {
        content: newPostContent.trim(),
        authorId: currentUser.uid,
        authorName: userData.displayName,
        authorLevel: userData.level,
        authorBadges: currentBadges,
        authorCurrentBadge: currentBadge,
        createdAt: new Date(),
        likes: [],
        commentCount: 0,
        category: selectedCategory,
        isPinned: false,
        heroAwards: []
      });

      setNewPostContent('');
      setShowCreatePost(false);
      toast.success('Post shared with community! +3 coins');
      
      if (userData) {
        const newCoins = userData.coins + 3;
        await updateUserData({
          coins: newCoins,
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Handle like post with proper error handling
  const handleLikePost = async (postId: string, currentLikes: string[]) => {
    if (!currentUser) return;

    const postRef = doc(db, 'communityPosts', postId);
    const isLiked = currentLikes.includes(currentUser.uid);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });

        // Check if post reached 10 likes and award coins to author
        const newLikeCount = currentLikes.length + 1;
        if (newLikeCount === 10) {
          const post = posts.find(p => p.id === postId);
          if (post && post.authorId !== currentUser.uid) {
            const authorRef = doc(db, 'users', post.authorId);
            await updateDoc(authorRef, {
              coins: increment(15)
            });
            
            console.log(`Post by ${post.authorName} reached 10 likes! +15 coins awarded.`);
          }
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) {
      toast.error("অনুগ্রহ করে ফলো করার জন্য লগইন করুন।");
      return;
    }
    if (currentUser.uid === targetUserId) {
      toast.error("আপনি নিজেকে ফলো করতে পারবেন না।");
      return;
    }

    const currentUserRef = doc(db, "users", currentUser.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const currentUserDoc = await transaction.get(currentUserRef);
        if (!currentUserDoc.exists()) {
          throw new Error("আপনার ইউজার প্রোফাইল খুঁজে পাওয়া যায়নি।");
        }
        
        const followingArray = currentUserDoc.data().following || [];
        const isCurrentlyFollowing = followingArray.includes(targetUserId);

        if (isCurrentlyFollowing) {
          transaction.update(currentUserRef, { following: arrayRemove(targetUserId) });
        } else {
          transaction.update(currentUserRef, { following: arrayUnion(targetUserId) });
        }
      });

      if (userData) {
        const wasFollowing = isFollowing(targetUserId);
        const newFollowing = wasFollowing 
          ? userData.following?.filter(id => id !== targetUserId) || []
          : [...(userData.following || []), targetUserId];
        
        await updateUserData({ following: newFollowing });
      }

      toast.success("ফলো স্ট্যাটাস আপডেট হয়েছে!");
    } catch (e) {
      console.error("Follow Transaction Failed:", e);
      toast.error("ফলো স্ট্যাটাস আপডেট করা যায়নি।");
    }
  };

  const handleStartChat = async (targetUser: User) => {
    if (!currentUser) {
      toast.error("অনুগ্রহ করে চ্যাট শুরু করার জন্য লগইন করুন।");
      return;
    }
    if (currentUser.uid === targetUser.id) {
      toast.error("আপনি নিজের সাথে চ্যাট করতে পারবেন না।");
      return;
    }

    const chatId = [currentUser.uid, targetUser.id].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);

    try {
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants: [currentUser.uid, targetUser.id],
          participantNames: {
            [currentUser.uid]: currentUser.displayName || "User",
            [targetUser.id]: targetUser.displayName || "User",
          },
          createdAt: serverTimestamp(),
          lastMessage: "",
        });
      }
      
      setSelectedChatUser(targetUser);
      setShowChatWindow(true);
      
    } catch (e) {
      console.error("Error initiating chat:", e);
      toast.error("চ্যাট সেশন শুরু করা যায়নি।");
    }
  };

  // NEW: Handle pin post (Community Hero feature)
  const handlePinPost = async (postId: string) => {
    if (!isCurrentUserHero()) {
      toast.error("শুধুমাত্র কমিউনিটি হিরো পোস্ট পিন করতে পারেন।");
      return;
    }

    try {
      // First, unpin all other posts
      const batch = writeBatch(db);
      posts.forEach(post => {
        if (post.isPinned && post.id !== postId) {
          batch.update(doc(db, 'communityPosts', post.id), { isPinned: false });
        }
      });

      // Pin the selected post
      batch.update(doc(db, 'communityPosts', postId), { isPinned: true });
      
      await batch.commit();
      toast.success("পোস্ট পিন করা হয়েছে!");
    } catch (error) {
      console.error('Error pinning post:', error);
      toast.error('পোস্ট পিন করতে সমস্যা হয়েছে');
    }
  };

  // NEW: Handle hero award (Community Hero feature)
  const handleHeroAward = async (postId: string) => {
    if (!isCurrentUserHero()) {
      toast.error("শুধুমাত্র কমিউনিটি হিরো পুরস্কার দিতে পারেন।");
      return;
    }

    try {
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, {
        heroAwards: arrayUnion(currentUser!.uid)
      });
      
      toast.success("হিরো পুরস্কার দেওয়া হয়েছে! 🏆");
    } catch (error) {
      console.error('Error giving hero award:', error);
      toast.error('পুরস্কার দিতে সমস্যা হয়েছে');
    }
  };

  const handleShowComments = (post: Post) => {
    setSelectedPost(post);
    setShowCommentModal(true);
  };

  const handleCommentAdded = () => {
    const newCommentCount = userCommentCount + 1;
    setUserCommentCount(newCommentCount);

    if (newCommentCount % 5 === 0 && userData) {
      const newCoins = userData.coins + 10;
      updateUserData({ coins: newCoins });
      toast.success('Wisdom Sharer! +10 coins for 5 comments!', { duration: 4000 });
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[3];
  };

  const filteredUsers = users.filter(user =>
    user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate pinned and regular posts
  const pinnedPosts = posts.filter(post => post.isPinned);
  const regularPosts = posts.filter(post => !post.isPinned);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header with Logo */}
      <div className="bg-white shadow-sm px-4 py-6">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center space-x-3">
              <img 
                src="/Untitled design (3).png" 
                alt="Sankalpa Logo" 
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">কমিউনিটি</h1>
                <p className="text-gray-600 text-sm">Connect and share your journey</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreatePost(true)}
              className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                activeTab === 'posts'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Posts</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Chat</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Community Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{users.length + 1}</div>
              <div className="text-xs text-gray-500">Members</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{posts.length}</div>
              <div className="text-xs text-gray-500">Posts</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{userData?.following?.length || 0}</div>
              <div className="text-xs text-gray-500">Following</div>
            </div>
          </div>
        </motion.div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <>
            {/* Feed Filter */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex space-x-1">
                {[
                  { key: 'relevant', label: 'Relevant', icon: TrendingUp },
                  { key: 'recent', label: 'Recent', icon: Clock },
                  { key: 'following', label: 'Following', icon: Users },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFeedFilter(filter.key as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-colors ${
                      feedFilter === filter.key
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <filter.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pinned Posts Section */}
            {pinnedPosts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Pin className="w-4 h-4 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Pinned Post</h3>
                </div>
                {pinnedPosts.map((post) => {
                  const categoryInfo = getCategoryInfo(post.category);
                  const isLiked = post.likes?.includes(currentUser?.uid || '');
                  const isFollowingAuthor = isFollowing(post.authorId);
                  const isOwnPost = post.authorId === currentUser?.uid;
                  const hasHeroAward = post.heroAwards?.includes(currentUser?.uid || '');
                  
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-lg p-6"
                    >
                      {/* Pinned indicator */}
                      <div className="flex items-center space-x-2 mb-3">
                        <Pin className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Pinned by Community Hero</span>
                      </div>

                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                              <img 
                                src={getBadgeImageUrl(post.authorCurrentBadge || 'clown')}
                                alt={post.authorName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/1.png';
                                }}
                              />
                            </div>
                            {/* Hero crown for Community Heroes */}
                            {users.find(u => u.id === post.authorId)?.isCommunityHero && (
                              <div className="absolute -top-1 -right-1">
                                <Crown className="w-4 h-4 text-yellow-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-800">{post.authorName}</h4>
                              <div className="flex items-center space-x-1">
                                <Award className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-gray-500">L{post.authorLevel}</span>
                              </div>
                              {/* Hero Awards Display */}
                              {post.heroAwards && post.heroAwards.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Trophy className="w-4 h-4 text-yellow-600" />
                                  <span className="text-xs text-yellow-700">{post.heroAwards.length}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                              {!isOwnPost && (
                                <>
                                  <button
                                    onClick={() => handleFollow(post.authorId)}
                                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                      isFollowingAuthor
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                  >
                                    {isFollowingAuthor ? (
                                      <div className="flex items-center space-x-1">
                                        <UserCheck className="w-3 h-3" />
                                        <span>Following</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <UserPlus className="w-3 h-3" />
                                        <span>Follow</span>
                                      </div>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      const user = users.find(u => u.id === post.authorId);
                                      if (user) handleStartChat(user);
                                    }}
                                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                          {categoryInfo.emoji} {categoryInfo.label}
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikePost(post.id, post.likes || [])}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                              isLiked
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{post.likes?.length || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleShowComments(post)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{post.commentCount || 0}</span>
                          </button>

                          {/* Hero Award Button (only for Community Heroes) */}
                          {isCurrentUserHero() && !isOwnPost && (
                            <button
                              onClick={() => handleHeroAward(post.id)}
                              disabled={hasHeroAward}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                hasHeroAward
                                  ? 'bg-yellow-100 text-yellow-600 cursor-not-allowed'
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              }`}
                            >
                              <Trophy className="w-4 h-4" />
                              <span className="text-sm">{hasHeroAward ? 'Awarded' : 'Award'}</span>
                            </button>
                          )}
                        </div>
                        
                        <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Regular Posts */}
            <div className="space-y-4">
              {regularPosts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
                  <p className="text-gray-600 text-sm mb-4">Be the first to share your journey!</p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Create First Post
                  </button>
                </div>
              ) : (
                regularPosts.map((post) => {
                  const categoryInfo = getCategoryInfo(post.category);
                  const isLiked = post.likes?.includes(currentUser?.uid || '');
                  const isFollowingAuthor = isFollowing(post.authorId);
                  const isOwnPost = post.authorId === currentUser?.uid;
                  const hasHeroAward = post.heroAwards?.includes(currentUser?.uid || '');
                  
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                              <img 
                                src={getBadgeImageUrl(post.authorCurrentBadge || 'clown')}
                                alt={post.authorName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/1.png';
                                }}
                              />
                            </div>
                            {/* Hero crown for Community Heroes */}
                            {users.find(u => u.id === post.authorId)?.isCommunityHero && (
                              <div className="absolute -top-1 -right-1">
                                <Crown className="w-4 h-4 text-yellow-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-800">{post.authorName}</h4>
                              <div className="flex items-center space-x-1">
                                <Award className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-gray-500">L{post.authorLevel}</span>
                              </div>
                              {/* Hero Awards Display */}
                              {post.heroAwards && post.heroAwards.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Trophy className="w-4 h-4 text-yellow-600" />
                                  <span className="text-xs text-yellow-700">{post.heroAwards.length}</span>
                                </div>
                              )}
                              {feedFilter === 'relevant' && post.relevanceScore && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                  Score: {Math.round(post.relevanceScore)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                              {!isOwnPost && (
                                <>
                                  <button
                                    onClick={() => handleFollow(post.authorId)}
                                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                      isFollowingAuthor
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                  >
                                    {isFollowingAuthor ? (
                                      <div className="flex items-center space-x-1">
                                        <UserCheck className="w-3 h-3" />
                                        <span>Following</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <UserPlus className="w-3 h-3" />
                                        <span>Follow</span>
                                      </div>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      const user = users.find(u => u.id === post.authorId);
                                      if (user) handleStartChat(user);
                                    }}
                                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              {/* Pin Button (only for Community Heroes on their own posts) */}
                              {isCurrentUserHero() && isOwnPost && !post.isPinned && (
                                <button
                                  onClick={() => handlePinPost(post.id)}
                                  className="text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-2 py-1 rounded-full transition-colors"
                                >
                                  <Pin className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                          {categoryInfo.emoji} {categoryInfo.label}
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikePost(post.id, post.likes || [])}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                              isLiked
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{post.likes?.length || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleShowComments(post)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{post.commentCount || 0}</span>
                          </button>

                          {/* Hero Award Button (only for Community Heroes) */}
                          {isCurrentUserHero() && !isOwnPost && (
                            <button
                              onClick={() => handleHeroAward(post.id)}
                              disabled={hasHeroAward}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                hasHeroAward
                                  ? 'bg-yellow-100 text-yellow-600 cursor-not-allowed'
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              }`}
                            >
                              <Trophy className="w-4 h-4" />
                              <span className="text-sm">{hasHeroAward ? 'Awarded' : 'Award'}</span>
                            </button>
                          )}
                        </div>
                        
                        <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Community Members */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Community Members</h3>
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No members found</p>
                ) : (
                  filteredUsers.map((user) => {
                    const isFollowingUser = isFollowing(user.id);
                    
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                              <img 
                                src={getBadgeImageUrl(user.currentBadge || 'clown')}
                                alt={user.displayName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/1.png';
                                }}
                              />
                            </div>
                            {user.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                            {/* Hero crown */}
                            {user.isCommunityHero && (
                              <div className="absolute -top-1 -right-1">
                                <Crown className="w-4 h-4 text-yellow-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-800">{user.displayName}</h4>
                              {user.isCommunityHero && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Hero</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Award className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-gray-500">Level {user.level}</span>
                              {user.isOnline ? (
                                <span className="text-xs text-green-600">Online</span>
                              ) : (
                                <span className="text-xs text-gray-400">Offline</span>
                              )}
                              {isFollowingUser && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Following</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleFollow(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isFollowingUser
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                          >
                            {isFollowingUser ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStartChat(user)}
                            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Share Your Journey</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Category Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value as Post['category'])}
                      className={`p-3 rounded-lg border-2 transition-colors text-left ${
                        selectedCategory === category.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{category.emoji}</span>
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your thoughts, progress, or ask for support..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newPostContent.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || loading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Posting...' : 'Share Post'}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {showChatWindow && selectedChatUser && (
          <ChatWindow
            user={selectedChatUser}
            currentUser={currentUser}
            onClose={() => {
              setShowChatWindow(false);
              setSelectedChatUser(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && selectedPost && (
          <CommentModal
            post={selectedPost}
            currentUser={currentUser}
            userData={userData}
            onClose={() => {
              setShowCommentModal(false);
              setSelectedPost(null);
            }}
            onCommentAdded={handleCommentAdded}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default Community;