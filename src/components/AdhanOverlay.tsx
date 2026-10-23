// src/components/AdhanOverlay.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adhanPlayer } from '../lib/adhanPlayer';
import { PrayerAlarm } from '../plugins/PrayerAlarm';
import { Capacitor } from '@capacitor/core';

interface Props {
  isVisible: boolean;
  prayerNameAr: string;
  onDismiss: () => void;
}

export const AdhanOverlay: React.FC<Props> = ({ isVisible, prayerNameAr, onDismiss }) => {
  // ✅ عقد الإيقاف محفوظ من النسخة السابقة — الزرار الجديد بيلف عليه
  const handleDismiss = async () => {
    // وقّف الـ JS audio
    adhanPlayer.stopAudio();
    // وقّف الـ Native AdhanPlayerService + IqamaPlayerService
    if (Capacitor.isNativePlatform()) {
      try {
        await PrayerAlarm.stopAdhan();
      } catch {
        // silent
      }
    }
    onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-hidden p-4"
          dir="rtl"
        >
          {/* خلفية نقش إسلامي خفيف */}
          <div className="absolute inset-0 islamic-pattern opacity-5 pointer-events-none"></div>

          {/* تأثير إضاءة الأورورا في الخلفية */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none"></div>

          {/* بطاقة التنبيه (Glassmorphism) */}
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-8 text-center overflow-hidden z-10"
          >
            {/* صورة مسجد خلفية للكارت (محلية) */}
            <div
              className="absolute inset-0 z-0 opacity-25 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/mosque_bg.jpg')" }}
            ></div>

            {/* طبقة تدرج لوني فوق الصورة عشان النص يبان */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent"></div>

            {/* المحتوى */}
            <div className="relative z-10">
              {/* موجات الرادار والأيقونة */}
              <div className="relative flex items-center justify-center h-28 mb-6 mt-2">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    className="absolute w-16 h-16 rounded-full border border-teal-400/40"
                    animate={{ scale: [0.5, 3.5], opacity: [0.8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute w-16 h-16 rounded-full border border-teal-400/30"
                    animate={{ scale: [0.5, 3.5], opacity: [0.8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
                  />
                  <motion.div
                    className="absolute w-16 h-16 rounded-full border border-teal-400/20"
                    animate={{ scale: [0.5, 3.5], opacity: [0.8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 1.6 }}
                  />
                </div>

                {/* الأيقونة الزجاجية — شعار التطبيق */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-slate-900/80 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.4)] flex items-center justify-center backdrop-blur-md">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain opacity-90" />
                </div>
              </div>

              {/* النصوص */}
              <div className="space-y-2 mb-8 text-white">
                <p className="text-sm font-medium text-slate-300">حان الآن وقت أذان</p>
                <h2 className="text-4xl font-bold text-teal-400 tracking-wide drop-shadow-md">{prayerNameAr}</h2>
                <p className="text-sm text-slate-400 mt-2">حي على الصلاة، حي على الفلاح</p>
              </div>

              {/* زر الإيقاف */}
              <motion.button
                onClick={handleDismiss}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 px-4 rounded-2xl font-bold text-white transition-all duration-300 bg-gradient-to-r from-teal-600 to-teal-400 shadow-[0_4px_15px_rgba(13,148,136,0.4)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.6)]"
              >
                إيقاف الأذان
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
