import React, { useState } from 'react';
import { Screen } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, MessageCircle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

// ══════════════════════════════════════════════════════════════
// Mentor Implementation
// ══════════════════════════════════════════════════════════════
export const Mentor = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    language: 'English',
    genderPref: 'Same Gender Only (Recommended)',
    method: 'online',
    helpNeeded: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    localStorage.setItem('mentor_request', JSON.stringify({ ...formData, timestamp: new Date().toISOString() }));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('questions').insert({
        user_id: user.id,
        question: `[MENTOR REQUEST] Language: ${formData.language}, Gender: ${formData.genderPref}, Method: ${formData.method}. Help: ${formData.helpNeeded}`,
        is_public: false,
      });
    }

    setIsSubmitted(true);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-bg-light dark:bg-bg-dark pb-20 overflow-y-auto islamic-pattern"
    >
      <div className="bg-primary text-white p-6 pt-12 pb-16 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
          <svg viewBox="0 0 24 24" width="160" height="160" fill="currentColor"><path d="M12 2L2 22h20L12 2z" /></svg>
        </div>
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button
            onClick={() => setScreen('ASK_CATEGORIES')}
            className="p-1.5 bg-white/10 hover:bg-white/20 transition rounded-full backdrop-blur-sm border border-white/20 tap-bounce"
          >
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <h2 className="text-3xl font-bold font-serif text-accent">{t('mentor.findMentor')}</h2>
        </div>
        <p className="text-emerald-100 font-medium relative z-10 leading-relaxed max-w-[90%]">
          {t('ask.mentorSubtitle')}
        </p>
      </div>

      <div className="p-6 -mt-10 relative z-10">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-black rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800"
            >
              <h3 className="font-bold font-serif text-primary dark:text-accent mb-6 text-xl">{t('ask.mentorFormTitle')}</h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{t('ask.preferredLanguage')}</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full p-3.5 rounded-xl border-2 border-gray-100 dark:border-gray-800 focus:border-primary dark:focus:border-accent outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option>English</option>
                    <option>French</option>
                    <option>Arabic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{t('ask.genderPreference')}</label>
                  <select
                    value={formData.genderPref}
                    onChange={(e) => setFormData({ ...formData, genderPref: e.target.value })}
                    className="w-full p-3.5 rounded-xl border-2 border-gray-100 dark:border-gray-800 focus:border-primary dark:focus:border-accent outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option>{t('ask.genderSameRecommended')}</option>
                    <option>{t('ask.genderNoPreference')}</option>
                  </select>
                  <div className="mt-2 flex items-start gap-1.5 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50 text-blue-800 dark:text-blue-300">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium leading-relaxed">
                      {t('ask.genderHint')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{t('ask.connectionMethod')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['online', 'inperson'] as const).map((val) => (
                      <label
                        key={val}
                        className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition ${formData.method === val ? 'border-primary bg-primary/5 dark:border-accent dark:bg-accent/10 dark:text-accent' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-black text-gray-700 dark:text-gray-400'}`}
                      >
                        <input
                          type="radio"
                          name="method"
                          value={val}
                          checked={formData.method === val}
                          onChange={() => setFormData({ ...formData, method: val })}
                          className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                        />
                        <span className="ml-2 text-sm font-semibold">{val === 'online' ? t('ask.onlineCall') : t('ask.inPerson')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{t('ask.helpNeeded')}</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.helpNeeded}
                    onChange={(e) => setFormData({ ...formData, helpNeeded: e.target.value })}
                    placeholder={t('ask.helpNeededPlaceholder')}
                    className="w-full p-3.5 rounded-xl border-2 border-gray-100 dark:border-gray-800 focus:border-primary dark:focus:border-accent outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition resize-none placeholder-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || formData.helpNeeded.trim() === ''}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-accent dark:text-emerald-950 dark:hover:bg-accent/90 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 transition shadow-[0_4px_14px_0_rgba(27,94,32,0.39)] tap-bounce"
                >
                  <MessageCircle size={20} /> {loading ? t('ask.submittingRequest') : t('ask.submitRequest')}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-black rounded-3xl p-8 shadow-xl border-2 border-primary/20 dark:border-accent/20 text-center"
            >
              <div className="w-20 h-20 bg-primary/10 dark:bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-primary dark:text-accent" />
              </div>
              <h3 className="font-bold font-serif text-2xl text-gray-900 dark:text-white mb-2">{t('ask.jazakTitle')}</h3>
              <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-4">{t('ask.requestReceived')}</h4>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-8">
                {t('ask.requestDesc')}
              </p>
              <button
                onClick={() => setScreen('ASK_CATEGORIES')}
                className="w-full py-3.5 border-2 border-primary dark:border-accent text-primary dark:text-accent font-bold rounded-xl hover:bg-primary/5 dark:hover:bg-accent/10 transition tap-bounce"
              >
                {t('ask.returnToQA')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
