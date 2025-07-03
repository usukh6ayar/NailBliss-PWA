import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useQRCode } from '../../hooks/useQRCode';
import { Sparkles, RotateCcw, Shield, Clock, Star, Gift } from 'lucide-react';

interface DigitalLoyaltyCardProps {
  user: {
    id: string;
    full_name: string;
    current_points: number;
    total_visits: number;
    created_at: string;
  };
}

export const DigitalLoyaltyCard: React.FC<DigitalLoyaltyCardProps> = ({ user }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [screenshotDetected, setScreenshotDetected] = useState(false);
  const { qrData, timeRemaining } = useQRCode(user.id);

  const progress = user.current_points % 5;
  const completedCards = Math.floor(user.current_points / 5);
  const isRewardReady = user.current_points > 0 && user.current_points % 5 === 0;

  // Screenshot detection (basic implementation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Simple detection - in production, use more sophisticated methods
        setTimeout(() => {
          if (!document.hidden) {
            setScreenshotDetected(true);
            setTimeout(() => setScreenshotDetected(false), 3000);
          }
        }, 100);
      }
    };

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable common screenshot shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) && 
        (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')
      ) {
        e.preventDefault();
        setScreenshotDetected(true);
        setTimeout(() => setScreenshotDetected(false), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const cardVariants = {
    front: {
      rotateY: 0,
      transition: { duration: 0.6, ease: "easeInOut" }
    },
    back: {
      rotateY: 180,
      transition: { duration: 0.6, ease: "easeInOut" }
    }
  };

  const bubbles = Array.from({ length: 5 }, (_, index) => {
    const isFilled = index < progress;
    const isGolden = isRewardReady && index === 4;
    
    return (
      <motion.div
        key={index}
        className={`relative w-12 h-12 rounded-full border-3 transition-all duration-700 ${
          isFilled
            ? isGolden
              ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 border-yellow-400 shadow-lg shadow-yellow-400/50'
              : 'bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 border-pink-300 shadow-lg shadow-pink-400/30'
            : 'bg-white/20 border-white/40 backdrop-blur-sm'
        }`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isFilled ? [1, 1.2, 1] : 1, 
          opacity: 1 
        }}
        transition={{ 
          delay: index * 0.1,
          scale: { duration: 0.5, times: [0, 0.5, 1] }
        }}
      >
        {isFilled && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            {isGolden ? (
              <Gift className="w-6 h-6 text-white drop-shadow-sm" />
            ) : (
              <Sparkles className="w-5 h-5 text-white drop-shadow-sm" />
            )}
          </motion.div>
        )}
        
        {isFilled && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0] }}
            transition={{ 
              delay: index * 0.1 + 0.5,
              duration: 1,
              repeat: isGolden ? Infinity : 0,
              repeatDelay: 2
            }}
            style={{
              background: isGolden 
                ? 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(244, 114, 182, 0.6) 0%, transparent 70%)'
            }}
          />
        )}
      </motion.div>
    );
  });

  const qrString = qrData ? JSON.stringify(qrData) : '';

  return (
    <div className="relative w-full max-w-sm mx-auto perspective-1000">
      {/* Screenshot Detection Warning */}
      <AnimatePresence>
        {screenshotDetected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -top-16 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 rounded-lg text-center text-sm font-medium shadow-lg"
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Screenshot detected - Card secured
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Container */}
      <motion.div
        className="relative w-full h-56 cursor-pointer preserve-3d"
        variants={cardVariants}
        animate={isFlipped ? "back" : "front"}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of Card */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden shadow-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative w-full h-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 p-6 flex flex-col justify-between">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg tracking-wide">NailBliss</h3>
                  <p className="text-white/80 text-xs font-medium">LOYALTY MEMBER</p>
                </div>
              </div>
              
              {isRewardReady && (
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 rounded-full"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-white text-xs font-bold">REWARD!</span>
                </motion.div>
              )}
            </div>

            {/* Member Name */}
            <div className="relative z-10">
              <p className="text-white/70 text-xs font-medium mb-1">MEMBER</p>
              <h2 className="text-white text-xl font-bold tracking-wide">
                {user.full_name.toUpperCase()}
              </h2>
            </div>

            {/* Progress Bubbles */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/80 text-sm font-medium">Visit Progress</p>
                <p className="text-white text-sm font-bold">{progress}/5</p>
              </div>
              <div className="flex justify-between items-center">
                {bubbles}
              </div>
            </div>

            {/* Stats */}
            <div className="relative z-10 flex justify-between items-center pt-2 border-t border-white/20">
              <div className="text-center">
                <p className="text-white text-lg font-bold">{user.total_visits}</p>
                <p className="text-white/70 text-xs">Total Visits</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-bold">{completedCards}</p>
                <p className="text-white/70 text-xs">Rewards Earned</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-bold">{new Date(user.created_at).getFullYear()}</p>
                <p className="text-white/70 text-xs">Member Since</p>
              </div>
            </div>

            {/* Flip Indicator */}
            <motion.div
              className="absolute bottom-4 right-4 text-white/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <RotateCcw className="w-4 h-4" />
            </motion.div>
          </div>
        </motion.div>

        {/* Back of Card */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden shadow-2xl"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="relative w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 flex flex-col justify-between">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-28 h-28 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-white blur-2xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 text-center">
              <h3 className="text-white font-bold text-lg mb-2">Scan to Check In</h3>
              <p className="text-gray-400 text-sm">Show this QR code to staff</p>
            </div>

            {/* QR Code */}
            <div className="relative z-10 flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                {qrString ? (
                  <QRCodeSVG
                    value={qrString}
                    size={120}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                ) : (
                  <div className="w-[120px] h-[120px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* QR Info */}
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <p className="text-blue-400 text-sm font-medium">
                  Expires in {timeRemaining}s
                </p>
              </div>
              <p className="text-gray-500 text-xs">
                QR code refreshes automatically for security
              </p>
            </div>

            {/* Terms */}
            <div className="relative z-10 bg-white/5 backdrop-blur-sm rounded-xl p-3">
              <h4 className="text-white text-sm font-semibold mb-2 flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-400" />
                Loyalty Terms
              </h4>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• Collect 5 visits for 50% off next service</li>
                <li>• Points expire after 12 months of inactivity</li>
                <li>• One QR scan per visit</li>
                <li>• Cannot be combined with other offers</li>
              </ul>
            </div>

            {/* Security Notice */}
            <div className="relative z-10 text-center">
              <p className="text-gray-600 text-xs flex items-center justify-center">
                <Shield className="w-3 h-3 mr-1" />
                Secure Digital Card • Screenshots Disabled
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Tap to Flip Hint */}
      <motion.p
        className="text-center text-gray-500 text-sm mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Tap card to flip
      </motion.p>
    </div>
  );
};