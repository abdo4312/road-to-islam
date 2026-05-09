// src/screens/AskScreens.tsx
import React, { useState } from 'react';
import { Screen } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Search, MessageCircle, ChevronRight, ThumbsUp, ThumbsDown, ArrowLeft, Send, Clock, CheckCircle, BookOpen, Info } from 'lucide-react';
import { FAQS, getFaqCategories, type FAQ } from '../constants/faq';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

// ══════════════════════════════════════════════════════════════
// Tab: FAQ Categories
// ══════════════════════════════════════════════════════════════
export const AskCategories = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const faqCategories = getFaqCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'ask'>('faq');

  const [dbFaqs, setDbFaqs] = useState<Array<{
    id: string;
    question: string;
    answer: string | null;
    category: string | null;
    created_at: string;
  }>>([]);

  React.useEffect(() => {
    supabase
      .from('questions')
      .select('id, question, answer, category, created_at')
      .eq('is_public', true)
      .eq('is_answered', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setDbFaqs(data ?? []));
  }, []);

  // الـ DB faqs تتحول لنفس شكل الـ FAQ interface
  const dbFaqsMapped = dbFaqs
    .filter(q => {
      const matchesSearch =
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.answer ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory
        ? q.category === selectedCategory
        : true;
      return matchesSearch && matchesCategory;
    })
    .map(q => ({
      id: q.id,
      category: q.category ?? 'general',
      question: q.question,
      shortAnswer: (q.answer ?? '').slice(0, 120),
      fullAnswer: q.answer ?? '',
      source: '',
    }));

  const hardcodedFiltered = FAQS.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.shortAnswer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? faq.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const filteredFaqs = [...dbFaqsMapped, ...hardcodedFiltered];

  const handleQuestionClick = (faq: FAQ) => {
    localStorage.setItem('selected_faq_id', faq.id);
    setScreen('ASK_DETAIL');
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full bg-bg-light dark:bg-bg-dark pb-28 overflow-y-auto islamic-pattern relative">

      {/* Header */}
      <div className="bg-primary text-white p-6 pt-12 pb-4 sticky top-0 z-20 shadow-md">
        <h2 className="text-2xl font-bold font-serif text-accent mb-4">{t('ask.title')}</h2>

        {/* Tabs */}
        <div className="flex bg-white/10 rounded-2xl p-1 gap-1 mb-4">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition tap-bounce flex items-center justify-center gap-2
              ${activeTab === 'faq' ? 'bg-white text-primary shadow-sm' : 'text-white/70'}`}
          >
            <BookOpen size={16} /> {t('ask.tabFaq')}
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition tap-bounce flex items-center justify-center gap-2
              ${activeTab === 'ask' ? 'bg-white text-primary shadow-sm' : 'text-white/70'}`}
          >
            <MessageCircle size={16} /> {t('ask.tabAsk')}
          </button>
        </div>

        {/* Search — يظهر بس في الـ FAQ tab */}
        {activeTab === 'faq' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/50" size={20} />
            <input
              type="text"
              placeholder={t('ask.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-emerald-100/50 focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
            />
          </div>
        )}
      </div>

      {/* ── FAQ Tab ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'faq' && (
          <motion.div key="faq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-6">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition tap-bounce
                  ${!selectedCategory ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-black border border-gray-100 dark:border-gray-800 text-gray-500'}`}
              >
                {t('faqCategories.all')}
              </button>
              {faqCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition tap-bounce
                    ${selectedCategory === cat.id ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-black border border-gray-100 dark:border-gray-800 text-gray-500'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map(faq => (
                  <button
                    key={faq.id}
                    onClick={() => handleQuestionClick(faq)}
                    className="w-full text-left p-4 bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between gap-4 hover:border-primary/30 dark:hover:border-accent/30 transition tap-bounce"
                  >
                    <h4 className="font-bold text-gray-900 dark:text-white leading-tight flex-1">{faq.question}</h4>
                    <ChevronRight size={18} className="text-gray-400 shrink-0" />
                  </button>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center text-center px-6">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-400 mb-4"><Search size={32} /></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('ask.noResultsTitle')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">{t('ask.noResultsDesc')}</p>
                  <button onClick={() => setActiveTab('ask')} className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg tap-bounce">
                    <MessageCircle size={20} /> {t('ask.tabAsk')}
                  </button>
                </div>
              )}
            </div>

            {filteredFaqs.length > 0 && (
              <div className="bg-emerald-50 dark:bg-accent/5 rounded-3xl p-6 border-2 border-emerald-100 dark:border-accent/10 text-center">
                <h3 className="font-bold text-emerald-900 dark:text-accent mb-2">{t('ask.cantFindQuestion')}</h3>
                <p className="text-sm text-emerald-700 dark:text-gray-400 mb-4">{t('ask.cantFindDesc')}</p>
                <button onClick={() => setActiveTab('ask')} className="bg-primary dark:bg-accent text-white dark:text-emerald-950 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 w-full tap-bounce shadow-md">
                  <MessageCircle size={20} /> {t('ask.tabAsk')}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Ask a Scholar Tab ── */}
        {activeTab === 'ask' && (
          <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AskScholar />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// ══════════════════════════════════════════════════════════════
// AskScholar — فورم السؤال + تاريخ الأسئلة
// ══════════════════════════════════════════════════════════════
function AskScholar() {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [myQuestions, setMyQuestions] = useState<any[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);

  // جلب أسئلة المستخدم الحالي
  React.useEffect(() => {
    const fetchMyQuestions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingQ(false); return; }

      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setMyQuestions(data ?? []);
      setLoadingQ(false);
    };
    fetchMyQuestions();
  }, [submitted]);

  const handleSubmit = async () => {
    if (!question.trim()) { setError(t('ask.writeQuestionFirst')); return; }
    if (question.trim().length < 20) { setError(t('ask.moreSpecific')); return; }

    setError('');
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('ask.signInRequired'));

      const { error: insertError } = await supabase
        .from('questions')
        .insert({
          user_id: user.id,
          question: question.trim(),
          is_public: false,
        });

      if (insertError) throw insertError;

      setQuestion('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 space-y-6">

      {/* Success Banner */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl"
          >
            <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">{t('ask.submittedTitle')}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">{t('ask.submittedDesc')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="bg-white dark:bg-black rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><MessageCircle size={20} className="text-primary dark:text-accent" /></div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{t('ask.tabAsk')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('ask.formSubtitle')}</p>
          </div>
        </div>

        <textarea
          value={question}
          onChange={e => { setQuestion(e.target.value); setError(''); }}
          placeholder={t('ask.formPlaceholder')}
          rows={5}
          className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none text-sm leading-relaxed transition"
        />

        {/* Character count */}
        <div className="flex items-center justify-between mt-2 mb-4">
          <span className={`text-xs ${question.length < 20 && question.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {t('ask.characterCount', { count: question.length })}
          </span>
          {question.length > 0 && question.length < 20 && (
            <span className="text-xs text-amber-500">{t('ask.addMoreDetail')}</span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
            <span className="text-red-500 text-base shrink-0">⚠</span>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || question.trim().length < 20}
          className="w-full bg-primary hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition tap-bounce shadow-md"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
          {submitting ? t('ask.submitting') : t('ask.submitQuestion')}
        </button>
      </div>

      {/* Adab Note */}
      <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl">
        <span className="text-2xl shrink-0">🌿</span>
        <div>
          <p className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-1">{t('ask.adabTitle')}</p>
          <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
            {t('ask.adabDesc')}
          </p>
        </div>
      </div>

      {/* My Previous Questions */}
      {!loadingQ && myQuestions.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white font-serif text-lg mb-4">{t('ask.previousQuestions')}</h3>
          <div className="space-y-3">
            {myQuestions.map(q => (
              <div key={q.id} className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-2">{q.question}</p>

                {q.is_answered && q.answer ? (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle size={14} className="text-primary dark:text-accent" />
                      <span className="text-xs font-bold text-primary dark:text-accent uppercase tracking-wide">{t('ask.scholarAnswer')}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{q.answer}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <Clock size={13} className="text-amber-500" />
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t('ask.awaitingAnswer')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state - no questions yet */}
      {!loadingQ && myQuestions.length === 0 && !submitted && (
        <div className="text-center py-6 text-gray-400 dark:text-gray-600">
          <MessageCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('ask.noQuestionsYet')}</p>
        </div>
      )}
    </div>
  );
}


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

// ─── Router ───────────────────────────────────────────────────
export default function AskScreens() {
  const location = useLocation();
  const initial = (location.state as any)?.initialScreen as Screen | undefined;

  const [screen, setScreen] = useState<Screen>(initial ?? 'ASK_CATEGORIES');

  React.useEffect(() => {
    if (initial) setScreen(initial);
  }, [location.key]);

  return (
    <>
      {screen === 'ASK_CATEGORIES' && <AskCategories setScreen={setScreen} />}
      {screen === 'ASK_DETAIL' && <AskDetail setScreen={setScreen} />}
      {screen === 'MENTOR' && <Mentor setScreen={setScreen} />}
    </>
  );
}
