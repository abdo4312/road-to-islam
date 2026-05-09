import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { PrayerAlarm } from '../plugins/PrayerAlarm';

export const MUEZZINS = [
    { id: 'husary', label: 'الشيخ الحصري', file: 'adhan_husary' },
    { id: 'abdulbasit', label: 'عبد الباسط عبد الصمد', file: 'adhan_abdulbasit' },
    { id: 'makkah', label: 'أذان مكة المكرمة', file: 'adhan_makkah' },
    { id: 'madinah', label: 'أذان المدينة المنورة', file: 'adhan_madinah' },
    { id: 'europe', label: 'أذان أوروبا', file: 'adhan_europe' },
];

export function getSelectedMuezzin(): string {
    return localStorage.getItem('selected_muezzin') || 'makkah';
}

export function setSelectedMuezzin(id: string): void {
    localStorage.setItem('selected_muezzin', id);
}

export function getIqamaDelay(): number {
    return parseInt(localStorage.getItem('iqama_delay') || '10');
}

export function setIqamaDelay(minutes: number): void {
    localStorage.setItem('iqama_delay', minutes.toString());
}

// ── Channel ID فريد لكل مؤذن ─────────────────────────────────
function getAdhanChannelId(): string {
    const muezzinId = getSelectedMuezzin();
    return `adhan_${muezzinId}`;
}

// ── جدول كل أذانات اليوم ─────────────────────────────────────
export async function scheduleAdhanNotifications(
    prayers: Array<{ name: string; time: string }>,
    mutedPrayers: Record<string, boolean>
): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') return;

    // Cancel only previously scheduled adhan/iqama notifications (IDs 1000–1099)
    // Do NOT cancel native plugin alarms or countdown notification (ID 998/999)
    const pending = await LocalNotifications.getPending();
    const adhanPending = pending.notifications.filter(
      (n) => n.id >= 1000 && n.id < 1100
    );
    if (adhanPending.length > 0) {
      await LocalNotifications.cancel({ notifications: adhanPending });
    }

    const muezzinId = getSelectedMuezzin();
    const muezzin = MUEZZINS.find(m => m.id === muezzinId) || MUEZZINS[2];
    const channelId = getAdhanChannelId();
    const iqamaDelay = getIqamaDelay();
    const today = new Date();
    const notifications = [];
    let notifId = 1000;

    for (const prayer of prayers) {
        if (prayer.name === 'Sunrise') continue;
        if (mutedPrayers[prayer.name]) continue;

        // Parse prayer time
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerDate = new Date(today);
        prayerDate.setHours(hours, minutes, 0, 0);

        // لو الوقت فات — متجدولش
        if (prayerDate <= new Date()) continue;

        // ── Adhan notification ──────────────────────────────────
        // الصوت بيجي من AdhanPlayerService (MediaPlayer) مش من الـ channel
        // channelId: 'adhan_silent' ← channel بدون صوت، الصوت جاي من PrayerAlarm native plugin
        notifications.push({
            id: notifId++,
            title: `🕌 حان وقت ${PRAYER_NAMES_AR[prayer.name] || prayer.name}`,
            body: `${muezzin.label}`,
            schedule: { at: prayerDate },
            smallIcon: 'ic_notification',
            channelId: 'adhan_silent',
            extra: {
                type: 'adhan',
                muezzin: muezzin.id,
                muezzinFile: muezzin.file,
                prayerName: prayer.name,
                prayerNameAr: PRAYER_NAMES_AR[prayer.name] || prayer.name,
                // بيانات إضافية للـ native handler
                audioFile: muezzin.file,
                shouldPlayAdhan: 'true',
            },
        });

        // ── Iqama notification ──────────────────────────────────
        const iqamaDate = new Date(prayerDate.getTime() + iqamaDelay * 60 * 1000);
        notifications.push({
            id: notifId++,
            title: `🕌 الإقامة — ${prayer.name}`,
            body: `حان وقت الإقامة`,
            schedule: { at: iqamaDate },
            sound: 'iqama',
            smallIcon: 'ic_notification',
            channelId: channelId,
        });
    }

    if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
    }
}

async function deleteAdhanChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    // احذف channel القديم الثابت + كل channels المؤذنين
    const allIds = ['adhan', ...MUEZZINS.map(m => `adhan_${m.id}`)];
    for (const id of allIds) {
        try {
            await LocalNotifications.deleteChannel({ id });
        } catch {
            // channel might not exist — ignore
        }
    }
}

// لاستذكار آخر muezzin تم إنشاء channel له
const CHANNEL_CACHE_KEY = 'last_channel_muezzin';

// ── إنشاء channel للأذان على Android ─────────────────────────
export async function createAdhanChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    // ── أنشئ الـ silent channel للأذان notification (مرة واحدة فقط) ──
    try {
      const existingChannels = await LocalNotifications.listChannels();
      const silentExists = existingChannels.channels.some(ch => ch.id === 'adhan_silent');
      if (!silentExists) {
        await LocalNotifications.createChannel({
          id: 'adhan_silent',
          name: 'أذان — إشعار صامت',
          description: 'إشعار الأذان بدون صوت — الصوت يشغّله النظام الأصلي',
          importance: 4,
          visibility: 1,
          vibration: false,
          sound: undefined,
        });
      }
    } catch {
      // ignore — channel creation failure is non-critical
    }

    const muezzinId = getSelectedMuezzin();
    const lastMuezzin = localStorage.getItem(CHANNEL_CACHE_KEY);
    const channelIdToCheck = `adhan_${muezzinId}`;

    // Check if channel actually exists on the device before skipping
    if (lastMuezzin === muezzinId) {
      try {
        const existingChannels = await LocalNotifications.listChannels();
        const channelExists = existingChannels.channels.some(
          (ch) => ch.id === channelIdToCheck
        );
        if (channelExists) return; // channel exists on device — safe to skip
        // channel missing on device (e.g. after reinstall) — fall through to recreate
        localStorage.removeItem(CHANNEL_CACHE_KEY);
      } catch {
        return; // can't list channels — assume it's fine
      }
    }

    // مؤذن تغيّر — احذف الـ channels القديمة وأنشئ الجديد
    await deleteAdhanChannel();

    const muezzin = MUEZZINS.find(m => m.id === muezzinId) || MUEZZINS[2];
    const channelId = getAdhanChannelId();

    await LocalNotifications.createChannel({
        id: channelId,
        name: `أذان — ${muezzin.label}`,
        description: 'أصوات الأذان والإقامة',
        importance: 5, // IMPORTANCE_HIGH
        visibility: 1,
        vibration: true,
        sound: muezzin.file,
    });

    // احفظ مؤذن الـ channel الحالي
    localStorage.setItem(CHANNEL_CACHE_KEY, muezzinId);
}

export async function recreateChannelForMuezzin(): Promise<void> {
    // فرخ channel cache عشان يتعامل createAdhanChannel معاه كأنه مؤذن جديد
    localStorage.removeItem(CHANNEL_CACHE_KEY);
    await createAdhanChannel();
}

// ── اسم الـ prayer بالعربي ────────────────────────────────────
export const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr:    'الفجر',
  Dhuhr:   'الظهر',
  Asr:     'العصر',
  Maghrib: 'المغرب',
  Isha:    'العشاء',
};

// ── جلب بيانات الصلاة من الـ cache ───────────────────────────
export function getPrayerTimingsFromCache(): Array<{ name: string; time: string }> | null {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(`prayer_data_${today}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const timings = data?.timings;
    if (!timings) return null;
    return Object.entries(timings)
      .filter(([name]) => !['Sunrise', 'Midnight', 'Firstthird', 'Lastthird', 'Imsak'].includes(name))
      .map(([name, time]) => ({ name, time: String(time).slice(0, 5) }));
  } catch {
    return null;
  }
}

// ── الصلاة القادمة ────────────────────────────────────────────
export function getNextPrayerFromCache(): { name: string; time: string; diffMins: number } | null {
  const prayers = getPrayerTimingsFromCache();
  if (!prayers) return null;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
    const found = prayers.find(x => x.name === p);
    if (!found) continue;
    const [h, m] = found.time.split(':').map(Number);
    const pMins = h * 60 + m;
    if (pMins > nowMins) {
      return { name: p, time: found.time, diffMins: pMins - nowMins };
    }
  }
  // كل صلوات اليوم اتخطت — التالي هو فجر بكرة
  const fajr = prayers.find(x => x.name === 'Fajr');
  if (fajr) {
    const [h, m] = fajr.time.split(':').map(Number);
    return { name: 'Fajr', time: fajr.time, diffMins: (24 * 60 - nowMins) + h * 60 + m };
  }
  return null;
}

// ── جدولة الأذانات من الـ cache (بدون UI) ────────────────────
export async function scheduleAdhanFromCache(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const prayers = getPrayerTimingsFromCache();
  if (!prayers) return; // مفيش cache — انتظر ما يفتحش التطبيق ويحمل البيانات

  const mutedRaw = localStorage.getItem('muted_prayers');
  const mutedPrayers: Record<string, boolean> = mutedRaw ? JSON.parse(mutedRaw) : {};

  // FIX: Native AlarmManager handles scheduling — LocalNotifications disabled to prevent double-play
  // await createAdhanChannel();
  // await scheduleAdhanNotifications(prayers, mutedPrayers);

  // بس ابعت للـ native plugin
  await syncPrayersToNative(prayers);
}

// ── Persistent Countdown Notification (في شريط الإشعارات — يتحرك كل ثانية) ──
export async function updateCountdownNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const next = getNextPrayerFromCache();
  if (!next) return;

  try {
    // أوقف الـ ForegroundService القديم (capawesome) لو شغال
    await ForegroundService.stopForegroundService().catch(() => {});

    // شغّل الـ Native Countdown Service (يتحرك كل ثانية)
    await PrayerAlarm.startCountdown();
  } catch (err) {
    console.warn('Native countdown failed, falling back to static:', err);
    // Fallback: ForegroundService ثابت (قديم) لو الـ native مش شغال
    try {
      const hrs = Math.floor(next.diffMins / 60);
      const mins = next.diffMins % 60;
      const timeStr = hrs > 0 ? `${hrs} س ${mins} د` : `${mins} دقيقة`;
      const nameAr = PRAYER_NAMES_AR[next.name] || next.name;

      await ForegroundService.startForegroundService({
        id: 999,
        title: `🕌 ${nameAr} — ${next.time}`,
        body: `باقي ${timeStr} على ${nameAr}`,
        smallIcon: 'ic_notification',
        silent: true,
        buttons: [],
      } as any);
    } catch (fallbackErr) {
      console.warn('ForegroundService fallback also failed:', fallbackErr);
    }
  }
}

// ── وقف الـ countdown (عند تعطيل الإشعارات) ─────────
export async function stopCountdownNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // أوقف الـ Native Countdown Service
  try {
    await PrayerAlarm.stopCountdown();
  } catch { /* ignore */ }

  // أوقف الـ ForegroundService القديم (capawesome) لو شغال
  try {
    await ForegroundService.stopForegroundService();
  } catch { /* ignore */ }

  // أزل أي LocalNotifications
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 998 }, { id: 999 }] });
  } catch { /* ignore */ }
}

// ── مزامنة بيانات الصلاة للـ Native Plugin ──────────────────
export async function syncPrayersToNative(
  prayers: Array<{ name: string; time: string }>
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const muezzin = getSelectedMuezzin();
    const iqamaDelay = getIqamaDelay();
    const mutedRaw = localStorage.getItem('muted_prayers');
    const mutedMap: Record<string, boolean> = mutedRaw ? JSON.parse(mutedRaw) : {};
    const mutedPrayers = Object.keys(mutedMap).filter(k => mutedMap[k]);
    const notificationsEnabled = localStorage.getItem('prayer_notifications') !== 'false';

    await PrayerAlarm.schedulePrayers({
      prayers,
      muezzin,
      iqamaDelay,
      mutedPrayers,
      notificationsEnabled,
    });

    // بعد sync البيانات → شغّل الـ countdown
    await PrayerAlarm.startCountdown();
  } catch (err) {
    console.warn('syncPrayersToNative failed:', err);
  }
}

// ── تفعيل/تعطيل الإشعارات من النظام الأصلي ─────────────────
export async function setNativeNotificationsEnabled(enabled: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PrayerAlarm.setNotificationsEnabled({ enabled });
    if (enabled) {
      await PrayerAlarm.startCountdown();
    } else {
      await PrayerAlarm.stopCountdown();
    }
  } catch (err) {
    console.warn('setNativeNotificationsEnabled failed:', err);
  }
}

// ── تحديث الإعدادات الأصلية (بعد تغيير المؤذن مثلاً) ───────
export async function updateNativeSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PrayerAlarm.updateSettings();
  } catch (err) {
    console.warn('updateNativeSettings failed:', err);
  }
}

// ── إيقاف الأذان فوراً (يُستدعى من JS في أي مكان) ──────
export async function stopAdhan(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PrayerAlarm.stopAdhan();
  } catch (err) {
    console.warn('stopAdhan failed:', err);
  }
}
