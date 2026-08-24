import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    MUEZZINS, getSelectedMuezzin, setSelectedMuezzin,
    getIqamaDelay, setIqamaDelay, recreateChannelForMuezzin,
    updateNativeSettings,
    scheduleAdhanFromCache,
} from '../lib/adhanService';
import { Capacitor } from '@capacitor/core';

interface Props {
    onClose: () => void;
}

export const MuezzinSelector: React.FC<Props> = ({ onClose }) => {
    const { t } = useTranslation();
    const [selected, setSelected] = React.useState(getSelectedMuezzin());
    const [delay, setDelay] = React.useState(getIqamaDelay());

    const handleSave = async () => {
        setSelectedMuezzin(selected);
        setIqamaDelay(delay);

        // Recreate the notification channel with the new muezzin's audio file
        await recreateChannelForMuezzin();

        if (Capacitor.isNativePlatform()) {
            // Update native plugin settings (muezzin, iqama delay, etc.)
            // ✅ FIX: نمرر المؤذن صراحة هنا عشان يتسجل native-side فورًا،
            // مش نعتمد بس على scheduleAdhanFromCache() اللي ممكن ترجع بصمت لو الكاش فاضي
            await updateNativeSettings(selected);

            // Re-schedule all today's adhan notifications with the new muezzin
            // This takes effect immediately without needing to reopen the prayer times screen
            await scheduleAdhanFromCache();
        }

        // Trigger storage event so adhanPlayer reloads the new muezzin audio
        window.dispatchEvent(new StorageEvent('storage', { key: 'selected_muezzin', newValue: selected }));

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl max-h-[75vh] flex flex-col">

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 p-6">
                    <h3 className="text-xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mb-6 text-center">
                        🕌 اختر المؤذن
                    </h3>

                    {/* قائمة المؤذنين */}
                    <div className="space-y-3 mb-6">
                        {MUEZZINS.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setSelected(m.id)}
                                className={`w-full p-4 rounded-2xl border-2 text-right transition tap-bounce
                    ${selected === m.id
                                        ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/20'
                                        : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <p className={`font-bold ${selected === m.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {m.label}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* وقت الإقامة */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            وقت الإقامة بعد الأذان
                        </label>
                        <div className="flex gap-2">
                            {[5, 10, 15, 20].map((min) => (
                                <button
                                    key={min}
                                    onClick={() => setDelay(min)}
                                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition
                      ${delay === min
                                            ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-gray-900'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {min} دقيقة
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sticky footer — always visible */}
                <div className="p-4 pb-24 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                  text-gray-600 dark:text-gray-400 font-bold"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 rounded-xl bg-emerald-500 dark:bg-emerald-400
                  text-white dark:text-gray-900 font-bold"
                        >
                            حفظ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
