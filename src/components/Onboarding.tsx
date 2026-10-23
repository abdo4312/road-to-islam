import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Heart, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);
  const { t } = useTranslation();

  const slides = [
    {
      id: 1,
      title: t('onboarding.slide1Title'),
      description: t('onboarding.slide1Desc'),
      icon: <Heart className="text-primary" size={48} />,
      color: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      id: 2,
      title: t('onboarding.slide2Title'),
      description: t('onboarding.slide2Desc'),
      icon: <BookOpen className="text-primary" size={48} />,
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      id: 3,
      title: t('onboarding.slide3Title'),
      description: t('onboarding.slide3Desc'),
      icon: <Clock className="text-primary" size={48} />,
      color: "bg-amber-50 dark:bg-amber-900/20"
    }
  ];

  const next = () => {
    if (current === slides.length - 1) {
      onComplete();
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-bg-light dark:bg-bg-dark flex flex-col islamic-pattern overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className={`w-32 h-32 rounded-3xl ${slides[current].color} flex items-center justify-center mb-10 shadow-sm ring-1 ring-black/5 dark:ring-white/5`}>
              {slides[current].icon}
            </div>
            
            <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              {slides[current].title}
            </h2>
            
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-sm">
              {slides[current].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-10 flex flex-col items-center gap-8 relative z-10">
        {/* Indicators */}
        <div className="flex gap-2.5">
          {slides.map((_, i) => (
            <div 
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-primary' : 'w-2 bg-gray-200 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={next}
          className="w-full max-w-sm py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 tap-bounce"
        >
          {current === slides.length - 1 ? (
            <>{t('onboarding.getStarted')} <CheckCircle2 size={20} /></>
          ) : (
            <>{t('onboarding.continue')} <ChevronRight size={20} /></>
          )}
        </button>

        {current < slides.length - 1 && (
          <button 
            onClick={onComplete}
            className="text-gray-400 dark:text-gray-600 text-sm font-medium hover:text-primary transition-colors"
          >
            {t('onboarding.skip')}
          </button>
        )}
      </div>
    </div>
  );
};
