import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, User, Globe, Moon, Bell, Calculator, Info, FileText, Shield, LogOut, Trash2 } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n, { AppLanguage, applyLanguageAttributes, normalizeLanguageCode } from '../i18n';

const LANGUAGE_OPTIONS: Array<{ code: AppLanguage; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ur', label: 'اردو' },
];

export default function Settings({ setScreen }: { setScreen?: (s: Screen) => void }) {
  const navigate = useNavigate();
  const { isAdmin, user, profile } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || ''
  );
  const [email, setEmail] = useState(
    user?.email || ''
  );
  const [language, setLanguage] = useState<AppLanguage>(
    normalizeLanguageCode(localStorage.getItem('user_language') || i18n.language)
  );
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [notifications, setNotifications] = useState(true);
  const [calcMethod, setCalcMethod] = useState('3'); // 3 is Muslim World League
  const [whatsapp, setWhatsapp] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const isMentor = profile?.role === 'mentor';
  const [savingProfile, setSavingProfile] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Update name when profile changes (e.g., after Google OAuth)
  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    } else if (user?.user_metadata?.full_name) {
      setName(user.user_metadata.full_name);
    }
  }, [profile, user]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Use real name from profile or user_metadata
        const realName =
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          'Brother/Sister';
        setName(realName);
        setEmail(authUser.email || 'No email');

        // خد gender و whatsapp من profile في AuthContext مباشرةً — بدون fetch تاني
        if (profile) {
          setGender((profile.gender as 'male' | 'female' | '') || '');
          setWhatsapp(profile.whatsapp_number || '');
        }
      } else {
        setName(localStorage.getItem('user_name') || 'Guest User');
        setEmail(localStorage.getItem('user_email') || 'Not provided');
      }

      const savedLanguage = localStorage.getItem('user_language') || i18n.language;
      setLanguage(normalizeLanguageCode(savedLanguage));
      setNotifications(localStorage.getItem('prayer_notifications') !== 'false');
      setCalcMethod(localStorage.getItem('calc_method') || '3');
    };
    loadProfile();
  }, [profile]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const langCode = normalizeLanguageCode(e.target.value);
    setLanguage(langCode);

    void i18n
      .changeLanguage(langCode)
      .then(() => {
        applyLanguageAttributes(langCode);
      })
      .catch((err) => {
        console.error('Failed to change language:', err);
      });
  };

  const toggleNotifications = () => {
    const nextNotif = !notifications;
    setNotifications(nextNotif);
    localStorage.setItem('prayer_notifications', nextNotif.toString());
  };

  const handleCalcMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCalcMethod(val);
    localStorage.setItem('calc_method', val);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (gender) updates.gender = gender;

      if (isMentor) {
        updates.whatsapp_number = whatsapp.trim() || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authUser.id);

      if (error) throw error;
      alert('Profile saved successfully!');
    } catch (err: any) {
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
  // supabase.auth.signOut() triggers onAuthStateChange → setUser(null)
  // → ProtectedRoute automatically redirects to /auth. No setScreen needed.
  await supabase.auth.signOut();
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_progress_days'); // correct key
};

  const handleResetProgress = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('user_progress').delete().eq('user_id', user.id);
  }
  // Clear the correct localStorage key
  localStorage.removeItem('user_progress_days');
  // Also clear per-day task completion flags
  Object.keys(localStorage)
    .filter(k => k.startsWith('task_'))
    .forEach(k => localStorage.removeItem(k));
  setShowResetConfirm(false);
  alert('Progress has been reset.');
};

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full bg-bg-light dark:bg-bg-dark pb-32 overflow-y-auto islamic-pattern">
      <div className="bg-primary text-white p-6 pt-12 pb-10 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
          <svg viewBox="0 0 24 24" width="160" height="160" fill="currentColor"><path d="M12 2L2 22h20L12 2z" /></svg>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => setScreen?.('HOME')} className="p-1.5 bg-white/10 hover:bg-white/20 transition rounded-full backdrop-blur-sm border border-white/20 tap-bounce">
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain opacity-80" />
            <h2 className="text-2xl font-bold font-serif text-accent">{t('settings.title')}</h2>
          </div>
        </div>
      </div>

      <div className="p-5 -mt-4 relative z-10 space-y-6">
        {/* Account Section */}
        <div className="bg-white dark:bg-black rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t('settingsSections.account')}</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-accent/20 flex items-center justify-center text-primary dark:text-accent font-bold text-xl border-2 border-primary/20 dark:border-accent/30 shrink-0">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-bold text-gray-900 dark:text-white text-lg truncate">{name}</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
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
                onChange={handleLanguageChange}
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
                onClick={toggleDarkMode}
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
                onClick={toggleNotifications}
                style={{ direction: 'ltr' }}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-primary dark:bg-accent' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Spiritual Tools Section */}
        <div className="bg-white dark:bg-black rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('settingsSections.spiritualTools')}</h3>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><Calculator size={18} /></div>
              {t('settingsSections.calcMethod')}
            </div>
            <select
              value={calcMethod}
              onChange={handleCalcMethodChange}
              className="bg-transparent text-sm font-semibold text-gray-900 dark:text-white outline-none text-right appearance-none cursor-pointer pr-4 max-w-[120px] truncate"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
            >
              <option value="1">U. of Islamic Sciences, Karachi</option>
              <option value="2">ISNA</option>
              <option value="3">Muslim World League</option>
              <option value="4">Umm Al-Qura, Makkah</option>
              <option value="5">Egyptian General Authority</option>
              <option value="8">Gulf Region</option>
              <option value="9">Kuwait</option>
              <option value="10">Qatar</option>
              <option value="11">Majlis Ugama Islam Singapura</option>
              <option value="12">Union Organization islamic de France</option>
              <option value="13">Diyanet İşleri Başkanlığı</option>
              <option value="14">Spiritual Admin of Muslims of Russia</option>
            </select>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-black rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('settingsSections.support')}</h3>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-900/50">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"><Info size={18} /></div>
                {t('settingsDanger.appVersion')}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">1.0.0</span>
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"><Shield size={18} /></div>
                {t('settingsSections.privacy')}
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"><FileText size={18} /></div>
                {t('settingsSections.terms')}
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Mentor Dashboard Section - Only for Mentors */}
        {isMentor && (
          <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-2 shadow-sm border border-primary/20 dark:border-primary/30">
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-bold text-primary dark:text-accent uppercase tracking-widest">Mentor Dashboard</h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => setScreen?.('MENTOR_DASHBOARD')}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-black rounded-2xl border border-primary/10 hover:bg-primary/5 dark:hover:bg-primary/20 transition group tap-bounce"
              >
                <div className="flex items-center gap-3 text-primary dark:text-accent font-bold">
                  <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                    <User size={18} />
                  </div>
                  Open Mentor Panel
                </div>
                <ChevronRight size={18} className="text-primary/50 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Admin Dashboard Section - Only for Admins */}
        {isAdmin && (
          <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-2 shadow-sm border border-primary/20 dark:border-primary/30">
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-bold text-primary dark:text-accent uppercase tracking-widest">Admin Dashboard</h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-black rounded-2xl border border-primary/10 hover:bg-primary/5 dark:hover:bg-primary/20 transition group tap-bounce"
              >
                <div className="flex items-center gap-3 text-primary dark:text-accent font-bold">
                  <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                    <Shield size={18} />
                  </div>
                  Open Admin Panel
                </div>
                <ChevronRight size={18} className="text-primary/50 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-900">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <User size={16} className="text-primary dark:text-accent" />
              {t('settingsSections.saveProfile')}
            </h3>
          </div>

          <div className="p-5 space-y-4">
            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('settingsSections.gender')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-3 rounded-xl border-2 text-sm font-bold transition tap-bounce
                      ${gender === g
                        ? 'border-primary bg-primary/5 text-primary dark:border-accent dark:text-accent dark:bg-accent/10'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                  >
                    {g === 'male' ? t('settingsSections.male') : t('settingsSections.female')}
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp — mentors only */}
            {isMentor && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  WhatsApp Number
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#25D366]/10 rounded-xl shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+1234567890 (with country code)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                      bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  This will be shared with students ONLY after you approve their request.
                </p>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50
                text-white font-bold rounded-xl transition tap-bounce flex items-center justify-center gap-2"
            >
              {savingProfile ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-black rounded-3xl p-5 shadow-sm border border-red-50 dark:border-red-900/20 space-y-3">
          <h3 className="text-sm font-bold text-red-400 dark:text-red-500 uppercase tracking-widest mb-4">{t('settingsDanger.dangerZone')}</h3>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-white dark:bg-black p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition shadow-sm tap-bounce"
            >
              <Trash2 size={18} /> {t('settingsDanger.resetProgress')}
            </button>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/50 text-center">
              <p className="text-red-800 dark:text-red-300 text-sm font-semibold mb-3">Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold tap-bounce">Cancel</button>
                <button onClick={handleResetProgress} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 tap-bounce">Yes, Reset</button>
              </div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="w-full bg-gray-100 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-800 transition tap-bounce"
          >
            <LogOut size={18} /> {t('settingsDanger.signOut')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
