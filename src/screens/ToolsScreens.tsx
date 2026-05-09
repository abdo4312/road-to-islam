import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Screen } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, MapPin, Navigation, Bell, BellOff, Search, Filter,
  AlertTriangle, ChevronRight, Info
} from 'lucide-react';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useQibla } from '../hooks/useQibla';
import { useMosques, Mosque } from '../hooks/useMosques';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import { useTranslation } from 'react-i18next';
import { createAdhanChannel, updateCountdownNotification, syncPrayersToNative } from '../lib/adhanService';
import { useLiveCountdown } from '../hooks/useLiveCountdown';
import { MuezzinSelector } from '../components/MuezzinSelector';

// ─────────────────────────────────────────────────────────────
// Qibla
// ─────────────────────────────────────────────────────────────
export const Qibla = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const {
    qiblaAngle, deviceHeading, rotationNeeded,
    distance, city, isSupported, isLoading, error, retry
  } = useQibla();

  const isDesktop = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const finalRotation = isDesktop ? 45 : rotationNeeded;
  const getDirectionTextV2 = (angle: number) => {
    if (Math.abs(angle) < 3) return t('tools.qibla.facingQibla');
    if (angle > 0) return t('tools.qibla.turnRight', { deg: Math.round(angle) });
    return t('tools.qibla.turnLeft', { deg: Math.abs(Math.round(angle)) });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-[#0d1b0e] text-white pb-20 overflow-y-auto relative islamic-pattern"
    >
      <div className="absolute top-4 left-4 z-10 flex">
        <button
          onClick={() => setScreen('HOME')}
          className="p-2 bg-white/10 hover:bg-white/20 transition rounded-full backdrop-blur-sm border border-white/10 tap-bounce"
        >
          <ChevronRight className="rotate-180" size={24} />
        </button>
      </div>

      <div className="p-6 pt-16 text-center relative z-10">
        <h2 className="text-3xl font-bold font-serif mb-2 text-accent">{t('tools.qibla.title')}</h2>
        <p className="text-emerald-100 opacity-80 font-medium">{t('tools.qibla.subtitle')}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 mb-16">
            <Compass size={64} className="text-emerald-500/50 animate-spin-slow" />
            <p className="text-emerald-100/70 font-medium">{t('tools.qibla.detectingLocation')}</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-center mb-16 max-w-[300px]">
            <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
            <p className="font-bold text-red-200 mb-2">{t('tools.qibla.locationFailed')}</p>
            <p className="text-sm text-red-100/70 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={retry}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-xl transition tap-bounce"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        ) : (
          <>
            <div className="relative w-[300px] h-[300px] mb-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-900/50 bg-[#0d1b0e] shadow-[0_0_50px_rgba(16,185,129,0.1)]" />

              <div className="absolute inset-4 rounded-full border-2 border-dashed border-emerald-800/80 flex items-center justify-center backdrop-blur-sm">
                <div className="w-1 h-6 bg-red-500 absolute top-0 rounded-b-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <div className="w-1 h-6 bg-gray-600 absolute bottom-0 rounded-t-full" />
                <div className="w-6 h-1 bg-gray-600 absolute left-0 rounded-r-full" />
                <div className="w-6 h-1 bg-gray-600 absolute right-0 rounded-l-full" />
                <span className="absolute top-8 text-xs font-bold text-red-400">N</span>
                <span className="absolute bottom-8 text-xs font-bold text-gray-500">S</span>
                <span className="absolute left-8 text-xs font-bold text-gray-500">W</span>
                <span className="absolute right-8 text-xs font-bold text-gray-500">E</span>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: finalRotation }}
                  transition={{ type: 'spring', stiffness: 20, damping: 25, mass: 1.5 }}
                  className="absolute inset-0 flex items-center justify-center drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  <div className="relative flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[80px] border-b-accent mb-1 drop-shadow-md" />
                    <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[80px] border-t-emerald-800" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-950 rounded-full z-10" />
                  </div>
                </motion.div>
                <div className="absolute text-sm z-20">🕋</div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 w-full text-center border border-white/10 shadow-xl">
              <h3 className={`text-2xl font-bold font-serif mb-2 ${Math.abs(finalRotation) < 5 ? 'text-accent' : 'text-emerald-400'}`}>
                {getDirectionTextV2(finalRotation)}
              </h3>

              <div className="flex justify-between text-sm text-emerald-100/70 mt-6 pt-6 border-t border-white/10">
                <div className="text-center flex-1 border-r border-white/10">
                  <p className="mb-1 text-[10px] uppercase tracking-wider font-bold opacity-60">{t('tools.qibla.locationLabel')}</p>
                  <p className="font-bold text-white text-base truncate px-2">{city.split(',')[0]}</p>
                </div>
                <div className="text-center flex-1 border-r border-white/10">
                  <p className="mb-1 text-[10px] uppercase tracking-wider font-bold opacity-60">{t('tools.qibla.qiblaLabel')}</p>
                  <p className="font-bold text-white text-base">{Math.round(qiblaAngle)}°</p>
                </div>
                <div className="text-center flex-1 border-r border-white/10">
                  <p className="mb-1 text-[10px] uppercase tracking-wider font-bold opacity-60">{t('tools.qibla.compassLabel')}</p>
                  <p className="font-bold text-white text-base">{Math.round(deviceHeading)}°</p>
                </div>
                <div className="text-center flex-1">
                  <p className="mb-1 text-[10px] uppercase tracking-wider font-bold opacity-60">{t('tools.qibla.distanceLabel')}</p>
                  <p className="font-bold text-white text-base">{distance.toLocaleString()} {t('tools.km')}</p>
                </div>
              </div>
            </div>

            {!isSupported && !isDesktop && (
              <div className="mt-8 flex items-center justify-center gap-2 text-amber-200/80 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 text-xs font-medium">
                <Info size={14} /> {t('tools.qibla.calibrateHint')}
              </div>
            )}

            {isDesktop && (
              <div className="mt-8 flex items-center justify-center gap-2 text-blue-200/80 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 text-xs font-medium max-w-[300px] text-center">
                <Info size={14} className="shrink-0" /> {t('tools.qibla.desktopHint')}
              </div>
            )}

            <p className="text-[11px] text-emerald-100/40 mt-8 text-center px-8 font-medium">
              {t('tools.qibla.hardwareHint')}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

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
    Sunrise: t('pray.sunrise'),
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
                    {prayer.name !== 'Sunrise' && (
                      <button
                        onClick={() => toggleMute(prayer.name)}
                        className={`p-2.5 rounded-full transition-colors tap-bounce ${isPast ? 'text-gray-300 dark:text-gray-700 cursor-default' : isMuted ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700' : 'text-primary dark:text-accent bg-primary/10 dark:bg-accent/10 hover:bg-primary/20 dark:hover:bg-accent/20'}`}
                        disabled={isPast}
                      >
                        {isMuted ? <BellOff size={20} /> : <Bell size={20} />}
                      </button>
                    )}
                    {prayer.name === 'Sunrise' && <div className="w-[42px]" />}
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

// ─────────────────────────────────────────────────────────────
// Leaflet Map — مكوّن مستقل
// ─────────────────────────────────────────────────────────────
// تأكد إنك زوّدت في index.html (أو vite.config.ts):
//   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
//   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

const LeafletMap = ({
  mosques,
  userLat,
  userLon,
  waitingLocationText,
  youAreHereText,
}: {
  mosques: Mosque[];
  userLat: number | null;
  userLon: number | null;
  waitingLocationText: string;
  youAreHereText: string;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    // انتظر إن Leaflet تكون محمّلة وإن في location
    if (!mapRef.current || !userLat || !userLon) return;
    const L = (window as any).L;
    if (!L) return;

    // امسح الـ instance القديم لو موجود (مهم عشان React Strict Mode)
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // أنشئ الخريطة
    const map = L.map(mapRef.current, { zoomControl: true }).setView([userLat, userLon], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // ماركر "أنت هنا"
    const youIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:#1b5e20;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,.4)"></div>`,
      className: '',
      iconAnchor: [7, 7],
    });
    L.marker([userLat, userLon], { icon: youIcon })
      .addTo(map)
      .bindPopup(`<b>${youAreHereText}</b>`);

    // ماركرات المساجد
    const mosqueIcon = L.divIcon({
      html: `<div style="width:12px;height:12px;background:#f59e0b;border:2px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,.3)"></div>`,
      className: '',
      iconAnchor: [6, 6],
    });
    mosques.forEach((m) => {
      L.marker([m.lat, m.lon], { icon: mosqueIcon })
        .addTo(map)
        .bindPopup(`<b>${m.name}</b><br/>${m.address}`);
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [userLat, userLon, mosques]);

  if (!userLat || !userLon) {
    return (
      <div className="h-52 w-full rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{waitingLocationText}</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="h-52 w-full rounded-xl z-10 border border-primary/20"
      style={{ minHeight: '208px' }}
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Mosques
// ─────────────────────────────────────────────────────────────
export const Mosques = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const { mosques, radiusKm, setRadiusKm, isLoading, error, userLat, userLon } = useMosques();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredMosques = mosques.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-bg-light dark:bg-bg-dark pb-20 overflow-y-auto islamic-pattern"
    >
      {/* Header */}
      <div className="bg-white dark:bg-black p-6 pt-12 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setScreen('HOME')}
            className="p-1 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition tap-bounce"
          >
            <ChevronRight className="rotate-180 text-gray-900 dark:text-white" size={24} />
          </button>
          <h2 className="text-2xl font-bold font-serif text-primary dark:text-accent">{t('tools.mosques.title')}</h2>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('tools.mosques.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition tap-bounce ${showFilters ? 'bg-primary/10 border-primary text-primary dark:bg-accent/10 dark:border-accent dark:text-accent' : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
          >
            <Filter size={20} />
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('tools.mosques.searchRadius')}</p>
            <div className="flex gap-2">
              {[1, 5, 10, 20].map((dist) => (
                <button
                  key={dist}
                  onClick={() => setRadiusKm(dist)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg border transition tap-bounce ${radiusKm === dist ? 'bg-primary text-white border-primary dark:bg-accent dark:text-emerald-950 dark:border-accent' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
                >
                  {dist} km
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Leaflet Map (بدل الـ placeholder) ── */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <LeafletMap
          mosques={mosques}
          userLat={userLat}
          userLon={userLon}
          waitingLocationText={t('tools.mosques.waitingLocation')}
          youAreHereText={t('tools.mosques.youAreHere')}
        />
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 text-center">
          {t('tools.mosques.mapAttribution')}
        </p>
      </div>

      {/* Mosque list */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center">
            <AlertTriangle size={48} className="text-amber-500 mb-4" />
            <p className="font-bold text-gray-900 dark:text-white mb-2">{t('tools.mosques.unableLoad')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        ) : filteredMosques.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center px-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-600 mb-4">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('tools.mosques.noFoundTitle')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{t('tools.mosques.noFoundDesc', { radius: radiusKm })}</p>
            <button
              onClick={() => setRadiusKm(radiusKm + 5)}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg tap-bounce transition active:scale-95"
            >
              {t('tools.mosques.tryRadius', { radius: radiusKm + 5 })}
            </button>
          </div>
        ) : (
          filteredMosques.map((mosque) => <MosqueCard key={mosque.id} mosque={mosque} />)
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// Mosque Card
// ─────────────────────────────────────────────────────────────
const MosqueCard: React.FC<{ mosque: Mosque }> = ({ mosque }) => {
  const { t } = useTranslation();
  const distanceStr =
    mosque.distanceMeter < 1000
      ? `${Math.round(mosque.distanceMeter)} ${t('tools.m')}`
      : `${(mosque.distanceMeter / 1000).toFixed(1)} ${t('tools.km')}`;

  const openGoogleMaps = () => {
    window.open(`https://maps.google.com/?q=${mosque.lat},${mosque.lon}`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-black rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-primary/30 dark:hover:border-accent/30 transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold font-serif text-lg text-gray-900 dark:text-white flex-1 pr-2 leading-tight">
          {mosque.name}
        </h3>
        <span className="bg-primary/10 text-primary dark:bg-accent/20 dark:text-accent text-xs font-bold px-2 py-1 rounded-md shrink-0 whitespace-nowrap">
          {distanceStr}
        </span>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 flex items-start gap-1.5 mt-2">
        <MapPin size={16} className="shrink-0 mt-0.5" />
        <span className="line-clamp-2">{mosque.address}</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {mosque.tags.map((tag) => (
          <span
            key={tag}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-[11px] font-medium uppercase tracking-wide px-2 py-1 rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>
      <button
        onClick={openGoogleMaps}
        className="w-full py-3 border-2 border-primary text-primary dark:border-accent dark:text-accent font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 dark:hover:bg-accent/10 transition tap-bounce"
      >
        <Navigation size={18} /> {t('tools.mosques.directions')}
      </button>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// Router — FIX: location.key بدل initial كـ dependency
// ─────────────────────────────────────────────────────────────
export default function ToolsScreens() {
  const location = useLocation();
  const initial = (location.state as any)?.initialScreen as Screen | undefined;

  const [screen, setScreen] = useState<Screen>(initial ?? 'PRAYER_TIMES');

  // ✅ FIX: location.key بيتغير في كل navigate حتى لو نفس الـ route
  // ده بيحل مشكلة إن لما تضغط Qibla وانت أصلاً في /tools ما بيتحدثش
  useEffect(() => {
    if (initial) setScreen(initial);
  }, [location.key]); // ← الـ fix الرئيسي هنا

  return (
    <>
      {screen === 'QIBLA' && <Qibla setScreen={setScreen} />}
      {screen === 'PRAYER_TIMES' && <PrayerTimes setScreen={setScreen} />}
      {screen === 'MOSQUES' && <Mosques setScreen={setScreen} />}
      {screen === 'HOME' && <Navigate to="/" replace />}
    </>
  );
}
