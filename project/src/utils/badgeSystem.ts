export interface Badge {
  id: string;
  name: string;
  minDays: number;
  imageUrl: string;
  color: string;
  description: string;
}

// IMPORTANT: The image URLs must point to the actual files in the /public/badges/ folder.
export const BADGE_PROGRESSION: Badge[] = [
  { 
    id: 'clown', 
    name: 'Clown', 
    minDays: 0, 
    imageUrl: '/1.png',
    color: 'bg-red-500',
    description: 'Starting your journey'
  },
  { 
    id: 'noob', 
    name: 'Noob', 
    minDays: 1, 
    imageUrl: '/2.png',
    color: 'bg-orange-500',
    description: 'First step taken'
  },
  { 
    id: 'novice', 
    name: 'Novice', 
    minDays: 3, 
    imageUrl: '/3.png',
    color: 'bg-yellow-500',
    description: 'Building momentum'
  },
  { 
    id: 'average', 
    name: 'Average', 
    minDays: 7, 
    imageUrl: '/4.png',
    color: 'bg-blue-500',
    description: 'One week strong'
  },
  { 
    id: 'advanced', 
    name: 'Advanced', 
    minDays: 15, 
    imageUrl: '/5.png',
    color: 'bg-purple-500',
    description: 'Two weeks of dedication'
  },
  { 
    id: 'sigma', 
    name: 'Sigma', 
    minDays: 30, 
    imageUrl: '/6.png',
    color: 'bg-green-500',
    description: 'One month champion'
  },
  { 
    id: 'chad', 
    name: 'Chad', 
    minDays: 45, 
    imageUrl: '/7.png',
    color: 'bg-indigo-500',
    description: 'Elite performer'
  },
  { 
    id: 'absolute_chad', 
    name: 'Absolute Chad', 
    minDays: 60, 
    imageUrl: '/8.png',
    color: 'bg-pink-500',
    description: 'Two months of excellence'
  },
  { 
    id: 'giga_chad', 
    name: 'Giga Chad', 
    minDays: 120, 
    imageUrl: '/9.png',
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    description: 'Legendary status achieved'
  },
  { 
    id: 'real_man', 
    name: 'Real Man', 
    minDays: 360, 
    imageUrl: '/9.png', // Using same image as giga_chad for now
    color: 'bg-gradient-to-r from-purple-600 to-pink-600',
    description: 'Ultimate mastery achieved'
  },
];

// Function to get the current badge based on streak days
export const getBadgeForStreak = (streakInDays: number): Badge => {
  let currentBadge = BADGE_PROGRESSION[0];
  for (const badge of BADGE_PROGRESSION) {
    if (streakInDays >= badge.minDays) {
      currentBadge = badge;
    } else {
      break;
    }
  }
  return currentBadge;
};

// Function to get information about the next badge
export const getNextBadgeInfo = (streakInDays: number): { nextBadge: Badge | null; daysRemaining: number } => {
  const currentBadge = getBadgeForStreak(streakInDays);
  const nextBadgeIndex = BADGE_PROGRESSION.findIndex(b => b.id === currentBadge.id) + 1;

  if (nextBadgeIndex < BADGE_PROGRESSION.length) {
    const nextBadge = BADGE_PROGRESSION[nextBadgeIndex];
    const daysRemaining = nextBadge.minDays - streakInDays;
    return { nextBadge, daysRemaining };
  }

  return { nextBadge: null, daysRemaining: 0 }; // User has reached the highest badge
};

// Function to calculate streak days from start date
export const calculateStreakDays = (streakStartDate: any): number => {
  if (!streakStartDate) return 0;
  
  const startDate = streakStartDate.toDate ? streakStartDate.toDate() : new Date(streakStartDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Function to update user badge automatically
export const updateUserBadge = async (
  streakStartDate: any,
  currentBadge: string | undefined,
  updateUserData: (data: any) => Promise<void>
): Promise<void> => {
  const streakDays = calculateStreakDays(streakStartDate);
  const newBadge = getBadgeForStreak(streakDays);
  
  if (currentBadge !== newBadge.id) {
    await updateUserData({ currentBadge: newBadge.id });
  }
};