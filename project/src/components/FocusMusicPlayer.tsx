import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipForward,
  SkipBack,
  X,
  Upload,
  Trash2,
  Plus
} from 'lucide-react';
import { useUserContext } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

interface CustomTrack {
  id: string;
  name: string;
  file: File;
  url: string;
  duration: string;
  userId: string;
  createdAt: any;
}

const FocusMusicPlayer: React.FC = () => {
  const { hasUnlockedItem } = useUserContext();
  const { currentUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFocusMusic = hasUnlockedItem('music', 'focus-music');

  // Default tracks
  const defaultTracks = [
    {
      id: 'default-1',
      name: 'Peaceful Meditation',
      duration: '10:00',
      description: 'Calm instrumental for deep focus',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' // Placeholder
    },
    {
      id: 'default-2',
      name: 'Nature Sounds',
      duration: '15:00',
      description: 'Rain and forest ambience',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' // Placeholder
    },
    {
      id: 'default-3',
      name: 'Zen Garden',
      duration: '12:00',
      description: 'Traditional meditation music',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' // Placeholder
    }
  ];

  // Combine default and custom tracks
  const allTracks = [...defaultTracks, ...customTracks.map(track => ({
    id: track.id,
    name: track.name,
    duration: track.duration,
    description: 'Custom uploaded track',
    url: track.url
  }))];

  // Load custom tracks from Firestore
  useEffect(() => {
    if (!currentUser || !hasFocusMusic) return;

    const q = query(
      collection(db, 'customTracks'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tracks: CustomTrack[] = [];
      querySnapshot.forEach((doc) => {
        tracks.push({ id: doc.id, ...doc.data() } as CustomTrack);
      });
      setCustomTracks(tracks);
    });

    return unsubscribe;
  }, [currentUser, hasFocusMusic]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!hasFocusMusic || !audioRef.current) return;
    
    const track = allTracks[currentTrack];
    if (!track) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % allTracks.length);
    setIsPlaying(false);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + allTracks.length) % allTracks.length);
    setIsPlaying(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingTrack(true);
    try {
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      
      // Get audio duration
      const audio = new Audio(url);
      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', resolve);
      });
      
      const duration = `${Math.floor(audio.duration / 60)}:${Math.floor(audio.duration % 60).toString().padStart(2, '0')}`;

      // Save track info to Firestore
      await addDoc(collection(db, 'customTracks'), {
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        fileName: file.name,
        duration,
        userId: currentUser.uid,
        createdAt: new Date(),
        fileSize: file.size,
        fileType: file.type
      });

      // Store file in localStorage for demo purposes
      // In a real app, you'd upload to Firebase Storage or another cloud storage
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem(`audio_${file.name}`, reader.result as string);
      };
      reader.readAsDataURL(file);

      toast.success('Track uploaded successfully!');
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading track:', error);
      toast.error('Failed to upload track');
    } finally {
      setUploadingTrack(false);
    }
  };

  const deleteCustomTrack = async (trackId: string, fileName: string) => {
    try {
      await deleteDoc(doc(db, 'customTracks', trackId));
      localStorage.removeItem(`audio_${fileName}`);
      toast.success('Track deleted successfully');
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Failed to delete track');
    }
  };

  const selectTrack = (index: number) => {
    setCurrentTrack(index);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  if (!hasFocusMusic) {
    return null;
  }

  return (
    <>
      {/* Floating Music Icon */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowPlayer(!showPlayer)}
        className="fixed top-20 right-4 z-30 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
        title="Focus Music Player"
      >
        <Music className="w-6 h-6" />
        {isPlaying && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </motion.button>

      {/* Music Player Modal */}
      <AnimatePresence>
        {showPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Focus Music</h2>
                      <p className="text-purple-200 text-sm">Meditation & Focus</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                      title="Upload custom track"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowPlayer(false)}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Track Info */}
              {allTracks.length > 0 && (
                <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Music className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{allTracks[currentTrack]?.name}</h3>
                    <p className="text-gray-600 text-sm">{allTracks[currentTrack]?.description}</p>
                    <p className="text-gray-500 text-xs mt-1">{allTracks[currentTrack]?.duration}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: isPlaying ? '45%' : '0%' }}
                        transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0:00</span>
                      <span>{allTracks[currentTrack]?.duration}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="p-6">
                {/* Main Controls */}
                <div className="flex items-center justify-center space-x-6 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={prevTrack}
                    disabled={allTracks.length === 0}
                    className="p-2 text-gray-600 hover:text-purple-600 transition-colors disabled:opacity-50"
                  >
                    <SkipBack className="w-6 h-6" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    disabled={allTracks.length === 0}
                    className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={nextTrack}
                    disabled={allTracks.length === 0}
                    className="p-2 text-gray-600 hover:text-purple-600 transition-colors disabled:opacity-50"
                  >
                    <SkipForward className="w-6 h-6" />
                  </motion.button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-3 mb-4">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>

              {/* Track List */}
              <div className="border-t border-gray-200 flex-1 overflow-y-auto">
                {allTracks.length === 0 ? (
                  <div className="p-8 text-center">
                    <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No tracks available</p>
                    <p className="text-gray-500 text-sm">Upload your first custom track to get started</p>
                  </div>
                ) : (
                  allTracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                      className={`p-4 transition-colors ${
                        index === currentTrack ? 'bg-purple-50 border-r-4 border-purple-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => selectTrack(index)}
                          className="flex-1 text-left"
                        >
                          <h4 className={`font-medium ${index === currentTrack ? 'text-purple-700' : 'text-gray-800'}`}>
                            {track.name}
                          </h4>
                          <p className="text-gray-600 text-sm">{track.description}</p>
                        </button>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <p className="text-gray-500 text-xs">{track.duration}</p>
                            {index === currentTrack && isPlaying && (
                              <div className="flex items-center space-x-1 mt-1 justify-end">
                                <div className="w-1 h-3 bg-purple-500 rounded animate-pulse"></div>
                                <div className="w-1 h-2 bg-purple-400 rounded animate-pulse delay-100"></div>
                                <div className="w-1 h-4 bg-purple-500 rounded animate-pulse delay-200"></div>
                              </div>
                            )}
                          </div>
                          {/* Delete button for custom tracks */}
                          {customTracks.find(ct => ct.id === track.id) && (
                            <button
                              onClick={() => {
                                const customTrack = customTracks.find(ct => ct.id === track.id);
                                if (customTrack) {
                                  deleteCustomTrack(track.id, customTrack.fileName);
                                }
                              }}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              title="Delete track"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Hidden Audio Element */}
              <audio 
                ref={audioRef} 
                onEnded={() => setIsPlaying(false)}
                onError={() => {
                  setIsPlaying(false);
                  toast.error('Error playing audio file');
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Upload Custom Track</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload an audio file</p>
                  <p className="text-gray-500 text-sm">Supports MP3, WAV, M4A (max 10MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingTrack}
                    className="mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50"
                  >
                    {uploadingTrack ? 'Uploading...' : 'Choose File'}
                  </motion.button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Tips for best experience:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Use high-quality audio files for better sound</li>
                    <li>• Instrumental or ambient music works best for focus</li>
                    <li>• Keep file sizes under 10MB for faster loading</li>
                    <li>• Files are stored locally on your device</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FocusMusicPlayer;