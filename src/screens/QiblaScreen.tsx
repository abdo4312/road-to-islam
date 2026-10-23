import { motion } from 'framer-motion';
import {
  Compass, AlertTriangle, ChevronRight, Info
} from 'lucide-react';
import { useQibla } from '../hooks/useQibla';
import { useTranslation } from 'react-i18next';
import { Screen } from '../types';

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
      <div className="absolute top-4 left-4 z-20 flex">
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
