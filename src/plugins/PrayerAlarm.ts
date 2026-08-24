import { registerPlugin } from '@capacitor/core';

export interface PrayerEntry {
  name: string;
  time: string;
}

export type AdhanDurationMode = 'full' | 'short' | 'silent';

export interface SchedulePrayersOptions {
  prayers: PrayerEntry[];
  muezzin: string;
  iqamaDelay: number;
  mutedPrayers: string[];
  notificationsEnabled: boolean;
  /** full | short | silent */
  adhanDurationMode?: AdhanDurationMode;
}

export interface SetNotificationsEnabledOptions {
  enabled: boolean;
}

export interface UpdateSettingsOptions {
  /** لو موجود → حدّث إعداد مدة الأذان فوراً في Native storage */
  adhanDurationMode?: AdhanDurationMode;
  /** لو موجود → حدّث المؤذن المختار فوراً في Native storage */
  muezzin?: string;
}

export interface PlayAdhanOptions {
  muezzin: string;      // e.g. 'adhan_makkah'
  prayerName: string;   // e.g. 'Fajr'
  prayerNameAr: string; // e.g. 'الفجر'
}

export interface PrayerAlarmPlugin {
  schedulePrayers(opts: SchedulePrayersOptions): Promise<{ success: boolean }>;
  setNotificationsEnabled(opts: SetNotificationsEnabledOptions): Promise<{ success: boolean }>;
  startCountdown(): Promise<{ success: boolean }>;
  stopCountdown(): Promise<{ success: boolean }>;
  updateSettings(opts?: UpdateSettingsOptions): Promise<{ success: boolean }>;
  /** شغّل الأذان بـ MediaPlayer — بيعرض إشعار بزر إيقاف */
  playAdhan(opts: PlayAdhanOptions): Promise<{ success: boolean }>;
  /** وقّف الأذان فوراً */
  stopAdhan(): Promise<{ success: boolean }>;
  requestBatteryOptimizationExemption(): Promise<{ prompted: boolean }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<{ prompted: boolean }>;
}

const PrayerAlarm = registerPlugin<PrayerAlarmPlugin>('PrayerAlarm', {
  web: {
    schedulePrayers: async () => ({ success: true }),
    setNotificationsEnabled: async () => ({ success: true }),
    startCountdown: async () => ({ success: true }),
    stopCountdown: async () => ({ success: true }),
    updateSettings: async () => ({ success: true }),
    playAdhan: async () => ({ success: true }),
    stopAdhan: async () => ({ success: true }),
    requestBatteryOptimizationExemption: async () => ({ prompted: false }),
    checkOverlayPermission: async () => ({ granted: false }),
    requestOverlayPermission: async () => ({ prompted: false }),
  },
});

export { PrayerAlarm };
