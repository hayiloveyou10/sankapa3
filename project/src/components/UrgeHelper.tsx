import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Users, 
  Activity,
  Brain,
  Wind,
  Timer,
  ArrowLeft,
  Coins
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import toast from 'react-hot-toast';

const UrgeHelper: React.FC = () => {
  const { t } = useTranslation();
  const { userData, updateUserData } = useAuth();
  const navigate = useNavigate();

  // Breathing Exercise State
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [breathingCycle, setBreathingCycle] = useState(0);
  const [breathingTimeRemaining, setBreathingTimeRemaining] = useState(120); // 2 minutes

  // Mental Exercise State
  const [mentalNumbers, setMentalNumbers] = useState<number[]>([]);
  const [mentalCurrentIndex, setMentalCurrentIndex] = useState(0);
  const [mentalCompleted, setMentalCompleted] = useState(false);
  const [mentalStarted, setMentalStarted] = useState(false);

  // Physical Activity State
  const [physicalCompleted, setPhysicalCompleted] = useState(false);

  // Breathing Exercise Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (breathingActive && breathingTimeRemaining > 0) {
      interval = setInterval(() => {
        setBreathingTimer(prev => {
          const newTimer = prev + 1;
          
          // Phase transitions: Inhale (4s) -> Hold (7s) -> Exhale (8s)
          if (breathingPhase === 'inhale' && newTimer >= 4) {
            setBreathingPhase('hold');
            return 0;
          } else if (breathingPhase === 'hold' && newTimer >= 7) {
            setBreathingPhase('exhale');
            return 0;
          } else if (breathingPhase === 'exhale' && newTimer >= 8) {
            setBreathingPhase('inhale');
            setBreathingCycle(prev => prev + 1);
            return 0;
          }
          
          return newTimer;
        });
        
        setBreathingTimeRemaining(prev => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase, breathingTimeRemaining]);

  // Auto-stop breathing exercise when time is up
  useEffect(() => {
    if (breathingTimeRemaining <= 0 && breathingActive) {
      setBreathingActive(false);
      toast.success('শ্বাস-প্রশ্বাসের ব্যায়াম সম্পন্ন! +5 কয়েন', { duration: 4000 });
      if (userData) {
        updateUserData({ coins: userData.coins + 5 });
      }
    }
  }, [breathingTimeRemaining, breathingActive, userData, updateUserData]);

  const startBreathing = () => {
    setBreathingActive(true);
    setBreathingPhase('inhale');
    setBreathingTimer(0);
    setBreathingCycle(0);
    setBreathingTimeRemaining(120);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    setBreathingTimer(0);
    setBreathingTimeRemaining(120);
  };

  const resetBreathing = () => {
    setBreathingActive(false);
    setBreathingPhase('inhale');
    setBreathingTimer(0);
    setBreathingCycle(0);
    setBreathingTimeRemaining(120);
  };

  // Mental Exercise Logic
  const startMentalExercise = () => {
    const numbers = Array.from({ length: 10 }, (_, i) => 20 - i * 2); // [20, 18, 16, 14, 12, 10, 8, 6, 4, 2]
    setMentalNumbers(numbers);
    setMentalCurrentIndex(0);
    setMentalCompleted(false);
    setMentalStarted(true);
  };

  const handleMentalNumberClick = (clickedNumber: number) => {
    const expectedNumber = mentalNumbers[mentalCurrentIndex];
    
    if (clickedNumber === expectedNumber) {
      if (mentalCurrentIndex === mentalNumbers.length - 1) {
        setMentalCompleted(true);
        toast.success('মানসিক ব্যায়াম সম্পন্ন! +8 কয়েন', { duration: 4000 });
        if (userData) {
          updateUserData({ coins: userData.coins + 8 });
        }
      } else {
        setMentalCurrentIndex(prev => prev + 1);
      }
    } else {
      toast.error('ভুল নম্বর! আবার চেষ্টা করুন।');
      setMentalCurrentIndex(0); // Reset on mistake
    }
  };

  const resetMentalExercise = () => {
    setMentalStarted(false);
    setMentalCompleted(false);
    setMentalCurrentIndex(0);
    setMentalNumbers([]);
  };

  // Physical Activity Logic
  const completePhysicalActivity = () => {
    setPhysicalCompleted(true);
    toast.success('শারীরিক কার্যকলাপ সম্পন্ন! +5 কয়েন', { duration: 4000 });
    if (userData) {
      updateUserData({ coins: userData.coins + 5 });
    }
  };

  const getBreathingCircleScale = () => {
    const progress = breathingTimer / (
      breathingPhase === 'inhale' ? 4 : 
      breathingPhase === 'hold' ? 7 : 8
    );
    
    if (breathingPhase === 'inhale') {
      return 0.5 + (progress * 0.5); // Scale from 0.5 to 1
    } else if (breathingPhase === 'hold') {
      return 1; // Stay at full size
    } else {
      return 1 - (progress * 0.5); // Scale from 1 to 0.5
    }
  };

  const getBreathingText = () => {
    switch (breathingPhase) {
      case 'inhale': return 'শ্বাস নিন / Inhale';
      case 'hold': return 'ধরে রাখুন / Hold';
      case 'exhale': return 'শ্বাস ছাড়ুন / Exhale';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-500 to-pink-600 px-4 py-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center mb-4"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">জরুরি সাহায্য</h1>
              <p className="text-red-100 text-sm">Urge Helper - Red Alert</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Motivational Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white shadow-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="mb-4"
          >
            <Heart className="w-16 h-16 mx-auto text-white" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">
            প্রতিটি 'না' বলা আপনাকে আরও শক্তিশালী করে!
          </h2>
          <p className="text-blue-100 text-sm">
            Every "No" makes you stronger!
          </p>
        </motion.div>

        {/* Breathing Exercise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Wind className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">শ্বাস-প্রশ্বাসের ব্যায়াম</h3>
              <p className="text-gray-600 text-sm">২ মিনিটের শান্তিদায়ক শ্বাস-প্রশ্বাসের ব্যায়াম</p>
            </div>
          </div>

          {!breathingActive && breathingTimeRemaining === 120 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startBreathing}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-4 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>শুরু করুন (Start)</span>
            </motion.button>
          ) : (
            <div className="space-y-6">
              {/* Breathing Visualization */}
              <div className="flex flex-col items-center space-y-4">
                <motion.div
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg"
                  animate={{
                    scale: breathingActive ? getBreathingCircleScale() : 0.5,
                  }}
                  transition={{
                    duration: breathingPhase === 'inhale' ? 4 : breathingPhase === 'hold' ? 0 : 8,
                    ease: "easeInOut"
                  }}
                >
                  <Wind className="w-12 h-12 text-white" />
                </motion.div>
                
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    {getBreathingText()}
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Timer className="w-4 h-4" />
                      <span>{formatTime(breathingTimeRemaining)}</span>
                    </div>
                    <div>
                      চক্র: {breathingCycle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={breathingActive ? stopBreathing : startBreathing}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center justify-center space-x-2"
                >
                  {breathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{breathingActive ? 'বিরতি' : 'চালু'}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetBreathing}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Mental Exercise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">মনের ব্যায়াম</h3>
              <p className="text-gray-600 text-sm">এই কাজটি করে আপনার মন অন্য দিকে মনোনিবেশ করুন</p>
            </div>
          </div>

          {!mentalStarted ? (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-purple-800 text-sm font-medium mb-2">নির্দেশনা:</p>
                <p className="text-purple-700 text-sm">
                  ২০ থেকে ২ পর্যন্ত জোড় সংখ্যাগুলো ক্রমানুসারে ক্লিক করুন। 
                  ভুল হলে আবার শুরু থেকে করতে হবে।
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startMentalExercise}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2"
              >
                <Brain className="w-5 h-5" />
                <span>শুরু করুন (Start)</span>
              </motion.button>
            </div>
          ) : mentalCompleted ? (
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">দারুণ করেছেন!</h4>
                <p className="text-gray-600 text-sm mb-4">মানসিক ব্যায়াম সম্পন্ন হয়েছে। +8 কয়েন অর্জিত!</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetMentalExercise}
                  className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-colors"
                >
                  আবার করুন
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-700 mb-2">
                  পরবর্তী সংখ্যা: <span className="font-bold text-purple-600">{mentalNumbers[mentalCurrentIndex]}</span>
                </p>
                <p className="text-sm text-gray-500">
                  অগ্রগতি: {mentalCurrentIndex + 1}/{mentalNumbers.length}
                </p>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {[20, 18, 16, 14, 12, 10, 8, 6, 4, 2].map((number) => (
                  <motion.button
                    key={number}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMentalNumberClick(number)}
                    className={`aspect-square rounded-xl font-bold text-lg transition-all ${
                      mentalCurrentIndex > mentalNumbers.indexOf(number)
                        ? 'bg-green-100 text-green-600 cursor-not-allowed'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                    disabled={mentalCurrentIndex > mentalNumbers.indexOf(number)}
                  >
                    {number}
                  </motion.button>
                ))}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetMentalExercise}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300 transition-colors"
              >
                রিসেট করুন
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Physical Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">শারীরিক কার্যকলাপ</h3>
              <p className="text-gray-600 text-sm">শারীরিক কার্যকলাপ আপনার মন পরিষ্কার করবে</p>
            </div>
          </div>

          {!physicalCompleted ? (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-6xl mb-4">🏃‍♂️</div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">১০ বার স্কোয়াট করুন</h4>
                <p className="text-green-700 text-sm mb-4">
                  পা কাঁধের সমান প্রশস্ত করে দাঁড়ান। ধীরে ধীরে বসুন এবং উঠুন।
                </p>
                
                {/* Simple squat animation guide */}
                <motion.div
                  className="w-16 h-16 bg-green-200 rounded-full mx-auto mb-4 flex items-center justify-center"
                  animate={{
                    y: [0, 10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Activity className="w-8 h-8 text-green-600" />
                </motion.div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={completePhysicalActivity}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>সম্পন্ন করেছি (I'm Done)</span>
              </motion.button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">দারুণ করেছেন!</h4>
                <p className="text-gray-600 text-sm mb-4">শারীরিক কার্যকলাপ সম্পন্ন হয়েছে। +5 কয়েন অর্জিত!</p>
                <div className="flex items-center justify-center space-x-2 text-yellow-600">
                  <Coins className="w-5 h-5" />
                  <span className="font-bold">+5 কয়েন</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Seek Help Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/community')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-6 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-700 transition-all flex items-center justify-center space-x-3 shadow-lg"
          >
            <Users className="w-6 h-6" />
            <span>সাপোর্ট প্রয়োজন? সম্প্রদায়ে সাহায্য চান</span>
          </motion.button>
          <p className="text-center text-gray-600 text-sm mt-2">
            Need Support? Seek Help in the Community
          </p>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default UrgeHelper;