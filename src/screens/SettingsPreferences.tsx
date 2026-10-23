import React from 'react';
import { Globe, Moon, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import i18n, { AppLanguage } from '../i18n';
import type { AdhanDurationMode } from '../plugins/PrayerAlarm';

const LANGUAGE_OPTIONS: Array<{ code: AppLanguage; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ur', label: 'اردو' },
];

interface SettingsPreferencesProps {
  language: AppLanguage;
  isDark: boolean;
  notifications: boolean;
  overlayGranted: boolean;
  adhanDuration: AdhanDurationMode;
  onLanguageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onToggleDarkMode: () => void;
  onToggleNotifications: () => void;
  onRequestOverlayPermission: () => void;
  onChangeAdhanDuration: (mode: AdhanDurationMode) => void;
}

// ══════════════════════════════════════════════════════════════
// Preferences Section — Presentational (P3 split)
// language / dark mode / notifications / overlay permission / adhan duration
// ══════════════════════════════════════════════════════════════
export const SettingsPreferences = ({
  language,
  isDark,
  notifications,
  overlayGranted,
  adhanDuration,
  onLanguageChange,
  onToggleDarkMode,
  onToggleNotifications,
  onRequestOverlayPermission,
  onChangeAdhanDuration,
}: SettingsPreferencesProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-black rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('settingsSections.preferences')}</h3>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-900/50">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><Globe size={18} /></div>
            {t('settings.language')}
          </div>
          <select
            value={language}
            onChange={onLanguageChange}
            className="bg-transparent text-sm font-semibold text-gray-900 dark:text-white outline-none text-right appearance-none cursor-pointer pr-4"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg"><Moon size={18} /></div>
            {t('settings.darkMode')}
          </div>
          <button
            onClick={onToggleDarkMode}
            style={{ direction: 'ltr' }}
            className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? 'bg-primary dark:bg-accent' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg"><Bell size={18} /></div>
            {t('settings.notifications')}
          </div>
          <button
            onClick={onToggleNotifications}
            style={{ direction: 'ltr' }}
            className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-primary dark:bg-accent' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {Capacitor.isNativePlatform() && (
          <div className="p-4 flex flex-col gap-1.5 border-t border-gray-50 dark:border-gray-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                <div className="p-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="9" width="18" height="12" rx="2" ry="2" />
                    <path d="M12 9V3" />
                  </svg>
                </div>
                {language === 'ar' ? 'النافذة العائمة للأذن والاقامة' : 'Adhan & Iqama Floating Overlay'}
              </div>
              <button
                onClick={onRequestOverlayPermission}
                style={{ direction: 'ltr' }}
                className={`w-12 h-6 rounded-full transition-colors relative ${overlayGranted ? 'bg-primary dark:bg-accent' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${overlayGranted ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mr-11 rtl:mr-11 ltr:ml-11 leading-normal">
              {language === 'ar'
                ? overlayGranted
                  ? 'مفعّلة حاليًا. لإيقافها، اضغط هنا للذهاب إلى إعدادات النظام وإغلاقها يدويًا من هناك.'
                  : 'تسمح بظهور بطاقة تنبيه الأذان والإقامة فوق البرامج الأخرى مع زر إيقاف واضح وإمكانية سحبها يميناً أو يساراً لإغلاقها.'
                : overlayGranted
                  ? 'Currently enabled. To turn it off, tap here to open system settings and disable it manually from there.'
                  : 'Allows the adhan or iqama alert card to float over other apps with a clear stop button, and can be swiped away to dismiss.'}
            </p>
          </div>
        )}

        {/* ── مدة الأذان والإقامة ── */}
        <div className="p-4 flex flex-col gap-3 border-t border-gray-50 dark:border-gray-900/50">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            {language === 'ar' ? 'مدة صوت الأذان' : 'Adhan Duration'}
          </div>
          
          <div className="grid grid-cols-3 gap-2 ml-11 rtl:mr-11 rtl:ml-0 ltr:ml-11">
            {[
              { id: 'full' as AdhanDurationMode, label: language === 'ar' ? 'كامل' : 'Full', desc: language === 'ar' ? 'الأذان كاملاً' : 'Full Adhan' },
              { id: 'short' as AdhanDurationMode, label: language === 'ar' ? 'قصير' : 'Short', desc: language === 'ar' ? '30 ثانية' : '30 seconds' },
              { id: 'silent' as AdhanDurationMode, label: language === 'ar' ? 'صامت' : 'Silent', desc: language === 'ar' ? 'تنبيه فقط' : 'Beep only' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChangeAdhanDuration(opt.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  adhanDuration === opt.id
                    ? 'bg-primary/10 border-primary dark:bg-accent/20 dark:border-accent text-primary dark:text-accent'
                    : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-white/5'
                }`}
              >
                <span className="text-xs font-bold">{opt.label}</span>
                <span className="text-[10px] opacity-60">{opt.desc}</span>
              </button>
            ))}
          </div>
          
          <p className="text-[11px] text-gray-400 dark:text-gray-500 ml-11 rtl:mr-11 rtl:ml-0 leading-normal">
            {adhanDuration === 'full' && (language === 'ar' ? 'سيتم تشغيل صوت الأذان كاملاً مع الكارت العائم.' : 'The full adhan will play with the floating overlay.')}
            {adhanDuration === 'short' && (language === 'ar' ? 'سيتوقف الصوت ويختفي الكارت العائم تلقائياً بعد 30 ثانية.' : 'Audio will stop and overlay will hide automatically after 30s.')}
            {adhanDuration === 'silent' && (language === 'ar' ? 'بدل صوت المؤذن، سيصدر تنبيه قصير متكرر. مفيد في الأماكن غير الطاهرة.' : 'Instead of adhan, a short beep will repeat. Useful in impure places.')}
          </p>
        </div>
      </div>
    </div>
  );
};
