import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Navigation, Search, Filter,
  AlertTriangle, ChevronRight
} from 'lucide-react';
import { useMosques, Mosque } from '../hooks/useMosques';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import { useTranslation } from 'react-i18next';
import { Screen } from '../types';

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
