import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, User, MessageCircle, Clock, ChevronLeft, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MentorChat } from './MentorChat';

interface Request {
  id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'declined';
  question_text: string;
  student_whatsapp: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    country: string;
  };
}

interface Question {
  id: string;
  user_id: string | null;
  question: string;
  answer: string | null;
  is_answered: boolean;
  is_public: boolean;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
}

export const MentorDashboard = ({ goBack }: { goBack: () => void }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'questions' | 'requests' | 'profile'>('requests');

  // Questions tab
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [answeringSaving, setAnsweringSaving] = useState<string | null>(null);

  // Profile tab
  const [mentorProfile, setMentorProfile] = useState<{
    full_name: string;
    whatsapp_number: string;
    country: string;
    gender: string;
  } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Chat state ──────────────────────────────────────────────
  const [openChatRequestId, setOpenChatRequestId] = useState<string | null>(null);
  const [openChatName, setOpenChatName] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchMentorProfile();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'questions') fetchQuestions();
  }, [activeTab]);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mentor_requests')
        .select(`
          id, student_id, status, question_text, student_whatsapp, created_at,
          profiles!student_id (full_name, country)
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const submitAnswer = async (questionId: string) => {
    const answer = answerText[questionId]?.trim();
    if (!answer || !user) return;
    setAnsweringSaving(questionId);
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          answer,
          is_answered: true,
          answered_by: user.id,
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);
      if (error) throw error;
      setQuestions(prev =>
        prev.map(q => q.id === questionId
          ? { ...q, answer, is_answered: true, answered_by: user.id }
          : q
        )
      );
      setAnswerText(prev => ({ ...prev, [questionId]: '' }));
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert('Failed to submit answer.');
    } finally {
      setAnsweringSaving(null);
    }
  };

  const fetchMentorProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, whatsapp_number, country, gender')
      .eq('id', user.id)
      .single();
    if (data) setMentorProfile(data as any);
  };

  const saveMentorProfile = async () => {
    if (!user || !mentorProfile) return;
    setProfileSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: mentorProfile.full_name,
          whatsapp_number: mentorProfile.whatsapp_number,
          country: mentorProfile.country,
          gender: mentorProfile.gender,
        })
        .eq('id', user.id);
      if (error) throw error;
      alert('Profile saved successfully.');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'declined') => {
    try {
      const { error } = await supabase
        .from('mentor_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update request.');
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const unansweredCount = questions.filter(q => !q.is_answered).length;

  // ── لو المنتور فتح الـ chat — اعرض شاشة الـ chat ──────────
  if (openChatRequestId) {
    return (
      <MentorChat
        requestId={openChatRequestId}
        otherPersonName={openChatName}
        goBack={() => setOpenChatRequestId(null)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-bg-light dark:bg-bg-dark pb-28 overflow-y-auto"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-primary text-white p-6 pt-12 pb-6 rounded-b-3xl shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={goBack}
            className="p-1.5 bg-white/10 hover:bg-white/20 transition rounded-full backdrop-blur-sm border border-white/20"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold font-serif text-accent">
              Mentor Dashboard
            </h2>
            <p className="text-emerald-100/80 text-sm">
              {mentorProfile?.full_name || 'Mentor'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending', value: pendingCount, color: 'bg-yellow-400/20 text-yellow-300' },
            { label: 'Approved', value: approvedCount, color: 'bg-emerald-400/20 text-emerald-300' },
            { label: 'Unanswered', value: unansweredCount, color: 'bg-red-400/20 text-red-300' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-2xl p-3 text-center`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 p-4 bg-white dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 sticky top-[160px] z-10 backdrop-blur-md">
        {([
          { key: 'requests', label: '📋 الطلبات' },
          { key: 'questions', label: '❓ الأسئلة' },
          { key: 'profile', label: '👤 ملفي' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition tap-bounce
              ${activeTab === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: الطلبات ────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="text-center text-primary/60 py-10">{t('common.loading')}</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-primary/60 py-10 flex flex-col items-center gap-3">
              <MessageCircle size={48} className="opacity-20" />
              <p>{t('mentorDashboard.noRequests')}</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white dark:bg-[#1a2e1e] p-5 rounded-2xl shadow-sm border border-primary/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{req.profiles?.full_name || 'Student'}</h3>
                      <p className="text-xs text-gray-500">{req.profiles?.country || 'Unknown Location'}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-md ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    req.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {req.status.toUpperCase()}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl mb-4 text-sm text-gray-700 dark:text-gray-300">
                  "{req.question_text}"
                </div>

                {/* ── Pending: زراري Approve / Decline ── */}
                {req.status === 'pending' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'declined')}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition"
                      >
                        <X size={16} /> {t('mentorDashboard.decline')}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'approved')}
                        className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition"
                      >
                        <Check size={16} /> {t('mentorDashboard.approve')}
                      </button>
                    </div>

                    {req.student_whatsapp && (
                      <button
                        onClick={() => {
                          const number = req.student_whatsapp!.replace(/\D/g, '');
                          const finalNumber = number.startsWith('0') ? '2' + number : number;
                          const msg = encodeURIComponent(
                            `السلام عليكم ${req.profiles?.full_name || ''}، بخصوص سؤالك:\n"${req.question_text}"\n\n`
                          );
                          const url = `https://wa.me/${finalNumber}?text=${msg}`;
                          if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
                            import('@capacitor/browser').then(({ Browser }) => Browser.open({ url }));
                          } else {
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="w-full py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        رد على واتساپ الطالب مباشرة
                      </button>
                    )}
                  </div>
                )}

                {/* ── Approved: زرار Open Chat ── */}
                {req.status === 'approved' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setOpenChatRequestId(req.id);
                        setOpenChatName(req.profiles?.full_name || 'Student');
                      }}
                      className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 dark:bg-accent/10 dark:hover:bg-accent/20 text-primary dark:text-accent rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle size={16} /> {t('mentorDashboard.openChat')}
                    </button>

                    {req.student_whatsapp && (
                      <button
                        onClick={() => {
                          const number = req.student_whatsapp!.replace(/\D/g, '');
                          const finalNumber = number.startsWith('0') ? '2' + number : number;
                          const msg = encodeURIComponent(
                            `السلام عليكم ${req.profiles?.full_name || ''}، بخصوص سؤالك:\n"${req.question_text}"\n\n`
                          );
                          const url = `https://wa.me/${finalNumber}?text=${msg}`;
                          if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
                            import('@capacitor/browser').then(({ Browser }) => Browser.open({ url }));
                          } else {
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="w-full py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        واتساپ الطالب
                      </button>
                    )}
                  </div>
                )}

                {/* ── Declined ── */}
                {req.status === 'declined' && (
                  <p className="text-xs text-center text-red-400 mt-2 font-medium">
                    {t('mentorDashboard.requestDeclined')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: الأسئلة ────────────────────────────────────────── */}
      {activeTab === 'questions' && (
        <div className="p-5 space-y-4">
          {questionsLoading ? (
            <div className="text-center text-primary/60 py-10">جاري التحميل...</div>
          ) : questions.length === 0 ? (
            <div className="text-center text-primary/60 py-10 flex flex-col items-center gap-3">
              <MessageCircle size={48} className="opacity-20" />
              <p>لا يوجد أسئلة حتى الآن</p>
            </div>
          ) : (
            questions.map(q => (
              <div
                key={q.id}
                className="bg-white dark:bg-[#1a2e1e] p-5 rounded-2xl shadow-sm border border-primary/10"
              >
                {/* Question Info */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <p className="text-sm font-bold text-gray-800 dark:text-white leading-snug flex-1">
                    {q.question}
                  </p>
                  <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-md ${q.is_answered
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                    {q.is_answered ? '✓ تمت الإجابة' : 'بدون إجابة'}
                  </span>
                </div>

                {/* Answer Display */}
                {q.is_answered && q.answer && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      الإجابة:
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{q.answer}</p>
                  </div>
                )}

                {/* Answer Form */}
                {!q.is_answered && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={answerText[q.id] || ''}
                      onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="اكتب إجابتك هنا..."
                      rows={3}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700
                        bg-gray-50 dark:bg-black/20 text-sm text-gray-800 dark:text-gray-200
                        resize-none focus:outline-none focus:border-primary dark:focus:border-accent"
                    />
                    <button
                      onClick={() => submitAnswer(q.id)}
                      disabled={!answerText[q.id]?.trim() || answeringSaving === q.id}
                      className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50
                        text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
                    >
                      <Send size={16} />
                      {answeringSaving === q.id ? 'جاري الحفظ...' : 'إرسال الإجابة'}
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-gray-400 mt-2">
                   تم إرساله في: {new Date(q.created_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: ملفي ───────────────────────────────────────────── */}
      {activeTab === 'profile' && mentorProfile && (
        <div className="p-5 space-y-4">
          <div className="bg-white dark:bg-[#1a2e1e] p-5 rounded-2xl shadow-sm border border-primary/10 space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={mentorProfile.full_name || ''}
                onChange={e => setMentorProfile(prev => prev ? { ...prev, full_name: e.target.value } : prev)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700
                  bg-gray-50 dark:bg-black/20 text-sm text-gray-800 dark:text-gray-200
                  focus:outline-none focus:border-primary dark:focus:border-accent"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                WhatsApp
              </label>
              <input
                type="tel"
                value={mentorProfile.whatsapp_number || ''}
                onChange={e => setMentorProfile(prev => prev ? { ...prev, whatsapp_number: e.target.value } : prev)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700
                  bg-gray-50 dark:bg-black/20 text-sm text-gray-800 dark:text-gray-200
                  focus:outline-none focus:border-primary dark:focus:border-accent"
                placeholder="+201xxxxxxxxx"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                الدولة
              </label>
              <input
                type="text"
                value={mentorProfile.country || ''}
                onChange={e => setMentorProfile(prev => prev ? { ...prev, country: e.target.value } : prev)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700
                  bg-gray-50 dark:bg-black/20 text-sm text-gray-800 dark:text-gray-200
                  focus:outline-none focus:border-primary dark:focus:border-accent"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                الجنس
              </label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setMentorProfile(prev => prev ? { ...prev, gender: g } : prev)}
                    className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition tap-bounce
                      ${mentorProfile.gender === g
                        ? 'border-primary bg-primary/10 text-primary dark:border-accent dark:bg-accent/10 dark:text-accent'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                  >
                    {g === 'male' ? '👨 ذكر' : '👩 أنثى'}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveMentorProfile}
              disabled={profileSaving}
              className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50
                text-white rounded-xl font-bold flex items-center justify-center gap-2 transition"
            >
              {profileSaving ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
