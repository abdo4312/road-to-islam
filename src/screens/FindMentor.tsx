import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Send, ChevronLeft, MessageCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import { useLocationMatch } from '../hooks/useLocationMatch';
import { useTranslation } from 'react-i18next';
import { MentorChat } from './MentorChat';

interface Mentor {
  id: string;
  full_name: string;
  country: string;
  city: string;
  gender: 'male' | 'female' | null;
}

interface RequestStatus {
  status: 'pending' | 'approved' | 'declined';
  question_text?: string;
  request_id?: string;
}

// —— WhatsApp Icon ——————————————————————————————————————————————————————————————
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const COUNTRY_DIAL_CODES: Record<string, string> = {
  EG: '20',
  SA: '966',
  MA: '212',
  DZ: '213',
  TN: '216',
  TR: '90',
  PK: '92',
  NG: '234',
  ID: '62',
  MY: '60',
  SN: '221',
};

const COUNTRY_NAME_TO_CODE: Record<string, keyof typeof COUNTRY_DIAL_CODES> = {
  EGYPT: 'EG',
  'SAUDI ARABIA': 'SA',
  MOROCCO: 'MA',
  ALGERIA: 'DZ',
  TUNISIA: 'TN',
  TURKEY: 'TR',
  PAKISTAN: 'PK',
  NIGERIA: 'NG',
  INDONESIA: 'ID',
  MALAYSIA: 'MY',
  SENEGAL: 'SN',
};

const resolveDialCode = (country: string): string | null => {
  const normalized = country.trim().toUpperCase();
  const countryCode = COUNTRY_NAME_TO_CODE[normalized] || (normalized as keyof typeof COUNTRY_DIAL_CODES);
  return COUNTRY_DIAL_CODES[countryCode] || null;
};

const formatWhatsAppNumber = (rawNumber: string, countryCode: string): string | null => {
  const trimmed = rawNumber.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!digitsOnly) return null;

  // If number already contains international prefix (+), keep digits as-is.
  if (trimmed.startsWith('+')) return digitsOnly;

  const dialCode = resolveDialCode(countryCode);
  if (digitsOnly.startsWith('0')) {
    if (!dialCode) return null;
    const localNumber = digitsOnly.replace(/^0+/, '');
    return localNumber ? `${dialCode}${localNumber}` : null;
  }

  // If number already starts with country code, keep it as-is.
  if (dialCode && digitsOnly.startsWith(dialCode)) return digitsOnly;

  return digitsOnly;
};

// —— Radar Animation ————————————————————————————————————————————————————————————
function RadarAnimation() {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center mx-auto">
      {/* Ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-accent/30"
          initial={{ width: 60, height: 60, opacity: 0.8 }}
          animate={{ width: 192, height: 192, opacity: 0 }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut',
          }}
        />
      ))}
      {/* Static rings */}
      <div className="absolute w-32 h-32 rounded-full border border-accent/20" />
      <div className="absolute w-20 h-20 rounded-full border border-accent/30" />
      {/* Center dot */}
      <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center z-10">
        <MapPin size={20} className="text-primary dark:text-accent" />
      </div>
    </div>
  );
}

// —— Avatar ————————————————————————————————————————————————————————————————————————
function MentorAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const colors = [
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  ];
  const colorClass = colors[name.charCodeAt(0) % colors.length];

  const sizeClass =
    size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-lg';

  return (
    <div className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-bold shrink-0`}>
      {initials || '?'}
    </div>
  );
}

// —— Main Component ——————————————————————————————————————————————————————————————
export const FindMentor = ({ goBack }: { goBack: () => void }) => {
  const { t } = useTranslation();
  const { location, loading: locationLoading } = useLocationMatch();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [question, setQuestion] = useState('');
  const [studentWhatsapp, setStudentWhatsapp] = useState('');
  const [requestStatuses, setRequestStatuses] = useState<Record<string, RequestStatus>>({});
  const [submitting, setSubmitting] = useState(false);
  const [myGender, setMyGender] = useState<'male' | 'female' | null>(null);
  const [openingWhatsApp, setOpeningWhatsApp] = useState(false);
  const [whatsAppError, setWhatsAppError] = useState<string | null>(null);

  // ── Chat state ──────────────────────────────────────────────
  const [openChatRequestId, setOpenChatRequestId] = useState<string | null>(null);
  const [openChatName, setOpenChatName] = useState('');

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('public_mentor_profiles')
        .select('id, full_name, country, city, gender')
        .eq('role', 'mentor');

      if (location?.country) {
        query = query.eq('country', location.country);
      }

      if (myGender) {
        query = query.eq('gender', myGender);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMentors(data || []);
    } catch (err) {
      console.error('Error fetching mentors:', err);
    } finally {
      setLoading(false);
    }
  }, [location, myGender]);

  const fetchMyRequests = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();
      if (myProfile?.gender) {
        setMyGender(myProfile.gender as 'male' | 'female');
      }

      const { data, error } = await supabase
        .from('mentor_requests')
        .select('id, mentor_id, status, question_text, created_at')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const statuses: Record<string, RequestStatus> = {};
      for (const req of data || []) {
        if (statuses[req.mentor_id]) continue;
        statuses[req.mentor_id] = {
          status: req.status as RequestStatus['status'],
          question_text: req.question_text || '',
          request_id: req.id,
        };
      }
      setRequestStatuses(statuses);
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
    fetchMyRequests();
  }, [fetchMentors, fetchMyRequests]);

  const handleSendRequest = async () => {
    const questionText = question.trim();
    if (!selectedMentor || !questionText) return;
    try {
      setSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: inserted, error } = await supabase
        .from('mentor_requests')
        .insert({
          student_id: user.id,
          mentor_id: selectedMentor.id,
          question_text: questionText,
          student_whatsapp: studentWhatsapp.trim() || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (!inserted) throw new Error('Failed to create request');

      setRequestStatuses((prev) => ({
        ...prev,
        [selectedMentor.id]: {
          status: 'pending',
          question_text: questionText,
          request_id: inserted?.id,
        },
      }));
      setSelectedMentor(null);
      setQuestion('');
      setStudentWhatsapp('');
    } catch (err) {
      console.error('Error sending request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const reqStatus = selectedMentor ? requestStatuses[selectedMentor.id] : null;

  // ── لو الطالب فتح الـ chat — اعرض شاشة المحادثة ──────────
  if (openChatRequestId) {
    return (
      <MentorChat
        requestId={openChatRequestId}
        otherPersonName={openChatName}
        goBack={() => setOpenChatRequestId(null)}
      />
    );
  }

  const handleOpenWhatsApp = async () => {
    if (!selectedMentor || reqStatus?.status !== 'approved') return;

    try {
      setOpeningWhatsApp(true);
      setWhatsAppError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Please sign in again to continue.');

      const { data: waNumber, error: waError } = await supabase.rpc('get_mentor_whatsapp', {
        mentor_uuid: selectedMentor.id,
        student_uuid: user.id,
      });

      if (waError) throw waError;
      if (!waNumber || typeof waNumber !== 'string') {
        throw new Error(t('mentor.whatsappUnavailable'));
      }

      const formattedNumber = formatWhatsAppNumber(waNumber, selectedMentor.country);
      if (!formattedNumber) {
        throw new Error(t('mentor.whatsappFormatError'));
      }

      const encodedMessage = encodeURIComponent(reqStatus.question_text || '');
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;

      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: whatsappUrl });
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setWhatsAppError(
        err instanceof Error ? err.message : t('mentor.whatsappOpenError')
      );
    } finally {
      setOpeningWhatsApp(false);
    }
  };

  useEffect(() => {
    setWhatsAppError(null);
    setOpeningWhatsApp(false);
  }, [selectedMentor?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-bg-light dark:bg-bg-dark pb-28 overflow-y-auto"
    >
      {/* —— Header —— */}
      <div className="bg-primary text-white p-6 pt-12 pb-6 rounded-b-3xl shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-1.5 bg-white/10 hover:bg-white/20 transition rounded-full backdrop-blur-sm border border-white/20 tap-bounce"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold font-serif text-accent">{t('mentor.findMentor')}</h2>
            {location?.country && (
              <p className="text-emerald-100 text-xs mt-0.5 flex items-center gap-1">
                <MapPin size={12} /> {location.country}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* —— Radar —— */}
        <div className="py-6">
          <RadarAnimation />
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium">
            {loading || locationLoading
              ? t('mentor.scanning')
              : t('mentor.foundCount', { count: mentors.length })}
          </p>
        </div>

        {/* —— Grid —— */}
        {loading || locationLoading ? (
          // Skeleton
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1a2e1a] rounded-2xl p-4 flex flex-col items-center gap-3 animate-pulse"
              >
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2 w-14 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MapPin size={28} className="text-primary/50" />
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">{t('mentor.noMentorsTitle')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t('mentor.noMentorsDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {mentors.map((mentor) => {
              const status = requestStatuses[mentor.id];
              return (
                <motion.button
                  key={mentor.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedMentor(mentor)}
                  className="bg-white dark:bg-[#1a2e1a] rounded-2xl p-4 flex flex-col items-center gap-3
                    border border-primary/10 dark:border-primary/20 shadow-sm
                    hover:border-primary/30 hover:shadow-md transition-all tap-bounce relative"
                >
                  {/* Status badge */}
                  {status && (
                    <div
                      className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white dark:border-[#1a2e1a]
                      ${
                        status.status === 'approved'
                          ? 'bg-green-500'
                          : status.status === 'pending'
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                      }`}
                    />
                  )}

                  <MentorAvatar name={mentor.full_name || '?'} size="md" />
                  {mentor.gender && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {mentor.gender === 'male' ? '👨' : '👩'}
                    </span>
                  )}

                  <div className="text-center">
                    <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                      {mentor.full_name || t('mentor.anonymous')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center justify-center gap-0.5">
                      <MapPin size={10} />
                      {mentor.city || mentor.country || t('mentor.unknown')}
                    </p>
                  </div>

                  {/* Mini status pill */}
                  {status?.status === 'approved' ? (
                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <WhatsAppIcon size={10} /> {t('mentor.connected')}
                    </div>
                  ) : status?.status === 'pending' ? (
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Clock size={10} /> {t('mentor.pending')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary dark:text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <MessageCircle size={10} /> {t('mentor.connect')}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* —— Bottom Sheet —— */}
      <AnimatePresence>
        {selectedMentor && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedMentor(null);
                setQuestion('');
              }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0d1b0e] rounded-t-3xl shadow-2xl"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
              </div>

              {/* Close */}
              <button
                onClick={() => {
                  setSelectedMentor(null);
                  setQuestion('');
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition tap-bounce"
              >
                <X size={20} className="text-gray-500" />
              </button>

              <div className="p-6 pb-10">
                {/* Mentor info */}
                <div className="flex items-center gap-4 mb-6">
                  <MentorAvatar name={selectedMentor.full_name || '?'} size="lg" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">
                      {selectedMentor.full_name || t('mentor.anonymousMentor')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={13} />
                      {[selectedMentor.city, selectedMentor.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Content by status */}
                {!reqStatus && (
                  // No request yet — show form
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('mentor.requestPrompt')}
                      </label>
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={t('mentor.requestPlaceholder')}
                        rows={4}
                        className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700
                          bg-gray-50 dark:bg-black text-gray-800 dark:text-white
                          focus:ring-2 focus:ring-primary focus:outline-none resize-none text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {t('mentor.requestHint')}
                      </p>
                    </div>

                    {/* WhatsApp number field */}
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('findMentor.whatsappFieldLabel')}
                      </label>
                      <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          📱
                        </span>
                        <input
                          type="tel"
                          value={studentWhatsapp}
                          onChange={(e) => setStudentWhatsapp(e.target.value)}
                          placeholder={t('findMentor.whatsappPlaceholder')}
                          className="w-full p-3.5 pr-10 rounded-2xl border border-gray-200 dark:border-gray-700
                            bg-gray-50 dark:bg-black text-gray-800 dark:text-white
                            focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                          dir="ltr"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {t('findMentor.whatsappFieldHint')}
                      </p>
                    </div>

                    <button
                      onClick={handleSendRequest}
                      disabled={submitting || !question.trim()}
                      className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                        text-white font-bold rounded-2xl flex items-center justify-center gap-2
                        transition tap-bounce shadow-lg"
                    >
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      {submitting ? t('mentor.sendingRequest') : t('mentor.sendRequest')}
                    </button>
                  </div>
                )}

                {reqStatus?.status === 'pending' && (
                  <div className="flex flex-col items-center py-6 text-center gap-3">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                      <Clock size={32} className="text-amber-500" />
                    </div>
                    <p className="font-bold text-gray-800 dark:text-white text-lg">{t('mentor.requestSentTitle')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('mentor.requestSentDesc')}
                    </p>
                  </div>
                )}

                {reqStatus?.status === 'approved' && (
                  <div className="space-y-3">
                    {/* Success header */}
                    <div className="flex flex-col items-center py-4 text-center gap-2">
                      <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <CheckCircle size={32} className="text-green-500" />
                      </div>
                      <p className="font-bold text-gray-800 dark:text-white">{t('mentor.requestAcceptedTitle')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('mentor.requestAcceptedDesc')}
                      </p>
                    </div>

                    {/* زرار Chat داخل التطبيق — الأساسي */}
                    <button
                      onClick={() => {
                        setOpenChatRequestId(reqStatus?.request_id ?? '');
                        setOpenChatName(selectedMentor?.full_name || 'Mentor');
                      }}
                      className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl
                        flex items-center justify-center gap-3 transition tap-bounce shadow-lg text-base"
                    >
                      <MessageCircle size={22} />
                      {t('findMentor.chatWithMentor')}
                    </button>

                    {/* زرار WhatsApp — اختياري */}
                    <button
                      onClick={handleOpenWhatsApp}
                      disabled={openingWhatsApp}
                      className="w-full py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366]
                        font-bold rounded-2xl flex items-center justify-center gap-2 transition
                        text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {openingWhatsApp ? (
                        <div className="w-4 h-4 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin" />
                      ) : (
                        <WhatsAppIcon size={18} />
                      )}
                      {openingWhatsApp ? t('mentor.openingWhatsapp') : t('mentor.openWhatsapp')}
                    </button>

                    {whatsAppError && (
                      <p className="text-sm text-center text-amber-700 dark:text-amber-400">
                        {whatsAppError}
                      </p>
                    )}
                  </div>
                )}

                {reqStatus?.status === 'declined' && (
                  <div className="flex flex-col items-center py-6 text-center gap-3">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <XCircle size={32} className="text-red-400" />
                    </div>
                    <p className="font-bold text-gray-800 dark:text-white">{t('mentor.requestDeclinedTitle')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('mentor.requestDeclinedDesc')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
