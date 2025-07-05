import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

export const getOrCreateChat = async (
  targetUserId: string,
  currentUser: User,
  targetUserDisplayName: string
): Promise<string> => {
  const chatId = [currentUser.uid, targetUserId].sort().join('_');
  const chatRef = doc(db, 'chats', chatId);

  try {
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      // Create the chat document
      await setDoc(chatRef, {
        participants: [currentUser.uid, targetUserId],
        participantNames: {
          [currentUser.uid]: currentUser.displayName || 'User',
          [targetUserId]: targetUserDisplayName
        },
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTimestamp: serverTimestamp()
      });
    }

    return chatId;
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    throw error;
  }
};