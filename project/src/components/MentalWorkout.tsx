import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, Brain, CheckCircle, XCircle } from 'lucide-react';

interface MentalWorkoutProps {
  onClose: () => void;
  onComplete?: () => void;
}

const puzzles = [
  {
    question: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?",
    options: ["$0.10", "$0.05", "$0.15", "$0.20"],
    correct: 1,
    explanation: "The ball costs $0.05. If the ball costs $0.05, then the bat costs $1.05 ($1.00 more than the ball). Together they cost $1.10."
  },
  {
    question: "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?",
    options: ["5 minutes", "100 minutes", "20 minutes", "1 minute"],
    correct: 0,
    explanation: "5 minutes. Each machine makes 1 widget in 5 minutes, so 100 machines make 100 widgets in 5 minutes."
  },
  {
    question: "In a lake, there is a patch of lily pads. Every day, the patch doubles in size. If it takes 48 days for the patch to cover the entire lake, how long would it take for the patch to cover half of the lake?",
    options: ["24 days", "47 days", "46 days", "25 days"],
    correct: 1,
    explanation: "47 days. Since the patch doubles every day, it was half the size the day before it covered the entire lake."
  },
  {
    question: "You have 12 balls that look identical. One of them is either heavier or lighter than the others. Using a balance scale only 3 times, how can you identify the different ball?",
    options: ["Divide into groups of 4", "Divide into groups of 6", "Weigh them one by one", "It's impossible"],
    correct: 0,
    explanation: "Divide into groups of 4. First weighing compares two groups of 4. Based on the result, you can narrow down to the group containing the different ball, then use 2 more weighings to identify it."
  },
  {
    question: "A man lives on the 20th floor of an apartment building. Every morning he takes the elevator down to the ground floor. When he comes home, he takes the elevator to the 10th floor and walks the rest of the way... except on rainy days, when he takes the elevator all the way to the 20th floor. Why?",
    options: ["He's exercising", "He's short and can't reach the 20th floor button", "The elevator is broken", "He likes walking"],
    correct: 1,
    explanation: "He's too short to reach the 20th floor button, but can reach the 10th floor button. On rainy days, he has an umbrella which he can use to press the 20th floor button."
  }
];

const MentalWorkout: React.FC<MentalWorkoutProps> = ({ onClose, onComplete }) => {
  const { t } = useTranslation();
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const puzzle = puzzles[currentPuzzle];

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === puzzle.correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentPuzzle < puzzles.length - 1) {
      setCurrentPuzzle(currentPuzzle + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-full">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t('mentalWorkout')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {completed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Workout Complete!</h3>
            <p className="text-gray-600 mb-4">
              You scored {score} out of {puzzles.length} puzzles correctly.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 font-medium">🎉 Mental workout completed!</p>
              <p className="text-green-700 text-sm">You earned 10 coins for strengthening your mind.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFinish}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Finish
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">
                  Question {currentPuzzle + 1} of {puzzles.length}
                </span>
                <span className="text-sm text-gray-500">
                  Score: {score}/{puzzles.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentPuzzle + 1) / puzzles.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-800 mb-4 leading-relaxed">{puzzle.question}</p>
              
              <div className="space-y-3">
                {puzzle.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !showResult && handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      showResult
                        ? index === puzzle.correct
                          ? 'bg-green-100 border-2 border-green-500 text-green-700'
                          : selectedAnswer === index
                          ? 'bg-red-100 border-2 border-red-500 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                        : selectedAnswer === index
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showResult && (
                        <div>
                          {index === puzzle.correct && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {selectedAnswer === index && index !== puzzle.correct && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-blue-50 rounded-xl"
              >
                <h3 className="font-semibold text-blue-800 mb-2">Explanation:</h3>
                <p className="text-blue-700 text-sm">{puzzle.explanation}</p>
              </motion.div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t('close')}
              </button>
              {showResult && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleNext}
                  className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  {currentPuzzle < puzzles.length - 1 ? 'Next' : 'Finish'}
                </motion.button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default MentalWorkout;