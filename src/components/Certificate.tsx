import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Award, Calendar, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { calculateStreakDays } from '../utils/badgeSystem';

interface CertificateProps {
  onClose: () => void;
}

const Certificate: React.FC<CertificateProps> = ({ onClose }) => {
  const { userData } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const link = document.createElement('a');
      link.download = `sankalpa-certificate-${userData?.displayName || 'user'}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success('সার্টিফিকেট ডাউনলোড সম্পন্ন!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('ডাউনলোড করতে সমস্যা হয়েছে');
    } finally {
      setDownloading(false);
    }
  };

  const streakDays = calculateStreakDays(userData?.streakStartDate);
  const achievementDate = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">সঙ্কল্পপত্র</h2>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              disabled={downloading}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'ডাউনলোড হচ্ছে...' : 'ডাউনলোড করুন'}</span>
            </motion.button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div className="p-8">
          <div
            ref={certificateRef}
            className="bg-white p-12 border-8 border-double border-yellow-600 relative"
            style={{ aspectRatio: '4/3' }}
          >
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-yellow-600"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-yellow-600"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-yellow-600"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-yellow-600"></div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">সঙ্কল্পপত্র</h1>
              <p className="text-lg text-gray-600">Certificate of Resolution</p>
            </div>

            {/* Content */}
            <div className="text-center space-y-6">
              <p className="text-lg text-gray-700">
                এই সার্টিফিকেট প্রমাণ করে যে
              </p>

              <div className="border-b-2 border-gray-300 pb-2 mb-4">
                <h2 className="text-3xl font-bold text-blue-600">{userData?.displayName}</h2>
              </div>

              <p className="text-xl text-gray-800 leading-relaxed">
                <span className="font-bold text-green-600">{streakDays} দিনের</span> সঙ্কল্প সফলভাবে সম্পন্ন করেছেন
                <br />
                এবং আত্মনিয়ন্ত্রণে অসাধারণ দক্ষতা প্রদর্শন করেছেন
              </p>

              <div className="flex justify-center items-center space-x-8 mt-8">
                <div className="text-center">
                  <Calendar className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">অর্জনের তারিখ</p>
                  <p className="font-semibold">{achievementDate}</p>
                </div>
                <div className="text-center">
                  <User className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">লেভেল</p>
                  <p className="font-semibold">{userData?.level}</p>
                </div>
              </div>

              {/* Seal */}
              <div className="absolute bottom-8 right-8">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <div className="text-center text-white">
                    <div className="text-xs font-bold">SANKALPA</div>
                    <div className="text-xs">OFFICIAL</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-8 text-center">
              <p className="text-xs text-gray-500">
                সঙ্কল্প অ্যাপ্লিকেশন দ্বারা প্রত্যয়িত
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Certificate;