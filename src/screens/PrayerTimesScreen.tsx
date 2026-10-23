import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Bell, BellOff, AlertTriangle, ChevronRight
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { useTranslation } from 'react-i18next';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { createAdhanChannel, updateCountdownNotification, syncPrayersToNative } from '../lib/adhanService';
import { useLiveCountdown } from '../hooks/useLiveCountdown';
import { MuezzinSelector } from '../components/MuezzinSelector';
import { Screen } from '../types';

// ─────────────────────────────────────────────────────────────
// Prayer Times
// ─────────────────────────────────────────────────────────────

const formatArabicTime = (time: string): string => {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const isAM = hours < 12;
  const suffix = isAM ? 'ص' : 'م';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  const arabicNums = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  const toArabic = (n: string) => n.split('').map(d => arabicNums[parseInt(d)] ?? d).join('');
  return `${toArabic(String(hours))}:${toArabic(minutes)} ${suffix}`;
};
export const PrayerTimes = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const { prayers, nextPrayer, city, hijriDateStr, gregorianDateStr, isLoading, error } = usePrayerTimes();
  
  // 🔴 Live countdown — updates every second
  const { countdown, prayerNameAr: liveNextPrayerAr, prayerTime: liveNextTime } = useLiveCountdown();
  const [mutedPrayers, setMutedPrayers] = useState<Record<string, boolean>>({});
  const [showMuezzin, setShowMuezzin] = useState(false);

  // جدول الأذانات لما البيانات تتحمل
  useEffect(() => {
    if (prayers.length > 0) {
      const setup = async () => {
        // 1. أنشئ الـ channel الصوتي
        await createAdhanChannel();
        // 2. بعّت بيانات الصلاة للـ native plugin (يشتغل في الخلفية)
        await syncPrayersToNative(prayers);
        // 3. حدّث الـ countdown في شريط الإشعارات
        await updateCountdownNotification();
        // ملاحظة: scheduleAdhanNotifications اتشال — adhanPlayer بيتولى تشغيل الصوت مباشرة
      };
      void setup();
    }
  }, [prayers]);
  const prayerNameMap: Record<string, string> = {
    Fajr: t('pray.fajr'),
    Dhuhr: t('pray.dhuhr'),
    Asr: t('pray.asr'),
    Maghrib: t('pray.maghrib'),
    Isha: t('pray.isha'),
  };

  useEffect(() => {
    const saved = localStorage.getItem('muted_prayers');
    if (saved) setMutedPrayers(JSON.parse(saved));
  }, []);

  const toggleMute = (prayerName: string) => {
    const newMuted = { ...mutedPrayers, [prayerName]: !mutedPrayers[prayerName] };
    setMutedPrayers(newMuted);
    localStorage.setItem('muted_prayers', JSON.stringify(newMuted));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-bg-light dark:bg-bg-dark pb-20 overflow-y-auto islamic-pattern"
    >
      <div className="bg-primary text-white p-6 pt-12 pb-24 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
          <svg viewBox="0 0 24 24" width="160" height="160" fill="currentColor"><path d="M12 2L2 22h20L12 2z" /></svg>
        </div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-start gap-2">
            <button onClick={() => setScreen('HOME')} className="p-1 -ml-2 rounded-full hover:bg-white/10 transition mt-0.5 tap-bounce">
              <ChevronRight className="rotate-180" size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold font-serif flex items-center gap-2 text-accent">
                <MapPin size={22} className="text-white" /> {city || t('tools.qibla.detectingLocation')}
              </h2>
              <p className="text-emerald-100 mt-1.5 text-sm font-medium">{gregorianDateStr || t('tools.prayer.loadingDate')}</p>
              <p className="text-emerald-50 text-xs opacity-90">{hijriDateStr}</p>
            </div>
          </div>
          {/* زرار المؤذن */}
          <button
            onClick={() => setShowMuezzin(true)}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition tap-bounce"
          >
            🎙️
          </button>
        </div>

        {/* Selector */}
        {showMuezzin && (
          <MuezzinSelector onClose={() => setShowMuezzin(false)} />
        )}

        <div className="text-center mt-2 relative z-10">
          <p className="text-emerald-100 font-medium mb-1 uppercase tracking-widest text-xs">{t('home.nextPrayer')}</p>
          <h1 className="text-5xl font-bold font-serif text-accent mb-2 drop-shadow-md">
            {isLoading ? '...' : (liveNextPrayerAr || (nextPrayer ? prayerNameMap[nextPrayer.name] || nextPrayer.name : '--'))}
          </h1>
          {/* Live countdown — ticks every second */}
          <p className="text-2xl font-bold font-mono bg-white/10 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20 tracking-widest tabular-nums">
            {isLoading ? '--:--:--' : countdown}
          </p>
        </div>
      </div>

      <div className="p-6 mt-4 relative z-10">
        <div className="bg-white dark:bg-black rounded-3xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <Skeleton variant="text" className="h-6 w-24" />
                  <div className="flex items-center gap-4">
                    <Skeleton variant="text" className="h-6 w-16" />
                    <Skeleton variant="circle" className="h-10 w-10" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center flex flex-col items-center">
              <AlertTriangle size={48} className="text-amber-500 mb-4" />
              <p className="font-bold text-gray-900 dark:text-white mb-2">{t('tools.prayer.locationFailed')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('tools.prayer.locationFailedDesc')}
              </p>
            </div>
          ) : (
            prayers.map((prayer) => {
              const isMuted = mutedPrayers[prayer.name];
              const isCurrent = prayer.status === 'current';
              const isPast = prayer.status === 'past';

              return (
                <div
                  key={prayer.name}
                  className={`flex items-center justify-between p-5 border-b border-gray-50 dark:border-gray-900 last:border-0 transition-colors ${isCurrent ? 'bg-primary/5 dark:bg-accent/10 border-l-4 border-l-primary dark:border-l-accent' : ''}`}
                >
                  <div>
                    <p className={`font-bold font-serif text-lg ${isCurrent ? 'text-primary dark:text-accent' : isPast ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      {prayerNameMap[prayer.name] || prayer.name}
                    </p>
                    {isCurrent && (
                      <p className="text-[10px] text-primary dark:text-accent font-bold uppercase tracking-widest mt-0.5">{t('tools.prayer.current')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-xl ${isCurrent ? 'text-primary dark:text-accent font-bold' : isPast ? 'text-gray-400 dark:text-gray-600 font-medium' : 'text-gray-800 dark:text-gray-200 font-semibold'}`}>
                      {formatArabicTime(prayer.time)}
                    </span>
                    <button
                      onClick={() => toggleMute(prayer.name)}
                      className={`p-2.5 rounded-full transition-colors tap-bounce ${isPast ? 'text-gray-300 dark:text-gray-700 cursor-default' : isMuted ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700' : 'text-primary dark:text-accent bg-primary/10 dark:bg-accent/10 hover:bg-primary/20 dark:hover:bg-accent/20'}`}
                      disabled={isPast}
                    >
                      {isMuted ? <BellOff size={20} /> : <Bell size={20} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};
