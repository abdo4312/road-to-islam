import { useTranslation } from 'react-i18next';

interface SettingsAccountProps {
  initials: string;
  name: string;
  email: string;
}

// ══════════════════════════════════════════════════════════════
// Account Section — Presentational (P3 split)
// ══════════════════════════════════════════════════════════════
export const SettingsAccount = ({ initials, name, email }: SettingsAccountProps) => {
  const { t } = useTranslation();

  return (
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
  );
};
