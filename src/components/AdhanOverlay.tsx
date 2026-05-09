// src/components/AdhanOverlay.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adhanPlayer } from '../lib/adhanPlayer';

interface Props {
  isVisible: boolean;
  prayerNameAr: string;
  onDismiss: () => void;
}

export const AdhanOverlay: React.FC<Props> = ({ isVisible, prayerNameAr, onDismiss }) => {
  const handleDismiss = () => {
    adhanPlayer.stopAudio();
    onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-emerald-950 via-emerald-900 to-black"
          style={{ direction: 'rtl' }}
        >
          {/* Animated circles */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-80 h-80 rounded-full border border-emerald-500/30"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute w-96 h-96 rounded-full border border-emerald-500/20"
          />

          {/* Mosque icon */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-8xl mb-6 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]"
          >
            🕌
          </motion.div>

          {/* Prayer name */}
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-5xl font-bold font-serif text-emerald-300 mb-3 text-center drop-shadow-lg"
          >
            {prayerNameAr}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-emerald-100/80 mb-12 font-medium"
          >
            حان وقت الأذان
          </motion.p>

          {/* Sound wave animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-1.5 mb-16"
          >
            {[0, 0.15, 0.3, 0.15, 0].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ scaleY: [1, 2.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeInOut' }}
                className="w-1.5 rounded-full bg-emerald-400"
                style={{ height: 20 + i * 6 + (4 - i) * 6 }}
              />
            ))}
          </motion.div>

          {/* Dismiss button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={handleDismiss}
            className="px-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-2xl text-white font-bold text-lg transition tap-bounce"
          >
            إيقاف الأذان
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
