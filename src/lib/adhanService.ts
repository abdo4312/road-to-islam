import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

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

    // احذف كل الـ notifications القديمة
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
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
        notifications.push({
            id: notifId++,
            title: `🕌 حان وقت ${prayer.name}`,
            body: `الأذان — ${muezzin.label}`,
            schedule: { at: prayerDate },
            smallIcon: 'ic_launcher',
            channelId: channelId,
        });

        // ── Iqama notification ──────────────────────────────────
        const iqamaDate = new Date(prayerDate.getTime() + iqamaDelay * 60 * 1000);
        notifications.push({
            id: notifId++,
            title: `🕌 الإقامة — ${prayer.name}`,
            body: `حان وقت الإقامة`,
            schedule: { at: iqamaDate },
            sound: 'iqama',
            smallIcon: 'ic_launcher',
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

// ── إنشاء channel للأذان على Android ─────────────────────────
export async function createAdhanChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    
    // احذف كل الـ channels القديمة أولاً
    await deleteAdhanChannel();
    
    const muezzinId = getSelectedMuezzin();
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
}

export async function recreateChannelForMuezzin(): Promise<void> {
    await createAdhanChannel();
}
