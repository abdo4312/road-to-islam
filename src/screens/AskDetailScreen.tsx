import React, { useState } from 'react';
import { Screen } from '../types';
import { motion } from 'framer-motion';
import { ChevronRight, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import { FAQS, type FAQ } from '../constants/faq';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

// ══════════════════════════════════════════════════════════════
// FAQ Detail
// ══════════════════════════════════════════════════════════════
export const AskDetail = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const faqId = localStorage.getItem('selected_faq_id');
  const [dbFaq, setDbFaq] = useState<FAQ | null>(null);
  
  const hardcodedFaq = FAQS.find(f => f.id === faqId);

  React.useEffect(() => {
    if (!hardcodedFaq && faqId) {
      supabase
        .from('questions')
        .select('*')
        .eq('id', faqId)
        .single()
        .then(({ data }) => {
          if (data) {
            setDbFaq({
              id: data.id,
              category: data.category ?? 'general',
              question: data.question,
              shortAnswer: (data.answer ?? '').slice(0, 120),
              fullAnswer: data.answer ?? '',
              source: '',
            });
          }
        });
    }
  }, [faqId, hardcodedFaq]);

  const faq = hardcodedFaq || dbFaq || FAQS[0];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full bg-bg-light dark:bg-bg-dark pb-28 overflow-y-auto relative islamic-pattern">
      <div className="bg-primary text-white p-4 pt-12 border-b border-primary shadow-sm sticky top-0 z-20 flex items-center gap-3">
        <button onClick={() => setScreen('ASK_CATEGORIES')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition tap-bounce">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold font-serif text-accent">{t('ask.answerTitle')}</h2>
      </div>

      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 leading-tight font-serif">{faq.question}</h1>

        <div className="space-y-6">
          <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary dark:bg-accent"></div>
            <h3 className="font-bold text-primary dark:text-accent uppercase tracking-widest text-xs mb-3">{t('ask.shortAnswer')}</h3>
            <p className="text-gray-800 dark:text-gray-100 font-bold text-lg leading-relaxed">{faq.shortAnswer}</p>
          </div>

          <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-xs mb-4">{t('ask.detailedExplanation')}</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg mb-6">{faq.fullAnswer}</p>
            {faq.source && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{t('ask.authenticSource')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-400 font-medium italic">"{faq.source}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center py-10 my-8 border-y border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 font-bold mb-6 uppercase tracking-widest text-xs">{t('ask.helpfulPrompt')}</p>
          <div className="flex gap-4">
            <button className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition tap-bounce shadow-sm"><ThumbsUp size={28} /></button>
            <button className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-full text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition tap-bounce shadow-sm"><ThumbsDown size={28} /></button>
          </div>
        </div>

        {/* Related Questions */}
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 font-serif text-lg">{t('ask.relatedQuestions')}</h3>
          <div className="space-y-3">
            {FAQS.filter(f => f.category === faq.category && f.id !== faq.id).slice(0, 2).map(rf => (
              <button
                key={rf.id}
                onClick={() => { localStorage.setItem('selected_faq_id', rf.id); setScreen('ASK_DETAIL'); window.scrollTo(0, 0); }}
                className="w-full text-left p-4 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-gray-700 dark:text-gray-300 font-bold flex justify-between items-center tap-bounce"
              >
                {rf.question} <ChevronRight size={18} className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
