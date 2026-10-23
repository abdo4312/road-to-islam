import { Trash2, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SettingsDangerZoneProps {
  showResetConfirm: boolean;
  onAskResetConfirm: () => void;
  onCancelResetConfirm: () => void;
  onResetProgress: () => void;
  onSignOut: () => void;
}

// ══════════════════════════════════════════════════════════════
// Danger Zone — Presentational (P3 split)
// ══════════════════════════════════════════════════════════════
export const SettingsDangerZone = ({
  showResetConfirm,
  onAskResetConfirm,
  onCancelResetConfirm,
  onResetProgress,
  onSignOut,
}: SettingsDangerZoneProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-black rounded-3xl p-5 shadow-sm border border-red-50 dark:border-red-900/20 space-y-3">
      <h3 className="text-sm font-bold text-red-400 dark:text-red-500 uppercase tracking-widest mb-4">{t('settingsDanger.dangerZone')}</h3>
      {!showResetConfirm ? (
        <button
          onClick={onAskResetConfirm}
          className="w-full bg-white dark:bg-black p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition shadow-sm tap-bounce"
        >
          <Trash2 size={18} /> {t('settingsDanger.resetProgress')}
        </button>
      ) : (
        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/50 text-center">
          <p className="text-red-800 dark:text-red-300 text-sm font-semibold mb-3">Are you sure? This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={onCancelResetConfirm} className="flex-1 py-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold tap-bounce">Cancel</button>
            <button onClick={onResetProgress} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 tap-bounce">Yes, Reset</button>
          </div>
        </div>
      )}

      <button
        onClick={onSignOut}
        className="w-full bg-gray-100 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-800 transition tap-bounce"
      >
        <LogOut size={18} /> {t('settingsDanger.signOut')}
      </button>
    </div>
  );
};
