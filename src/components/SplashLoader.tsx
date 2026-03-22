import React from 'react';
import { motion } from 'framer-motion';

export const SplashLoader: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-light dark:bg-bg-dark islamic-pattern"
    >
      <div className="relative">
        {/* Decorative background glow */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.4 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 bg-primary blur-3xl rounded-full"
        />
        
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.2
          }}
          className="relative z-10 w-32 h-32 md:w-40 md:h-40"
        >
          <img 
            src="/logo.png" 
            alt="Islame Logo" 
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </motion.div>
      </div>

      {/* Text Animation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mt-8 text-center"
      >
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-accent tracking-wider">
          ISLAME
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium tracking-widest text-xs uppercase">
          Your Spiritual Journey Begins
        </p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1, duration: 1.5, repeat: Infinity }}
          className="text-gray-400 dark:text-gray-500 mt-1 text-xs"
        >
          Syncing your data...
        </motion.p>
      </motion.div>

      {/* Progress Bar */}
      <div className="absolute bottom-20 w-40 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          className="h-full bg-primary dark:bg-accent"
        />
      </div>
    </motion.div>
  );
};
