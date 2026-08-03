// src/lib/adhanPlayer.ts
// Creative Solution: Direct HTMLAudioElement scheduler — no LocalNotifications for adhan audio

import { getSelectedMuezzin, getPrayerTimingsFromCache } from './adhanService';

// ── Arabic prayer names (local copy to avoid circular import) ─────────
const AR_NAMES: Record<string, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

// ── Audio file mapping ────────────────────────────────────────────────
const AUDIO_URLS: Record<string, string> = {
  husary:      '/audio/adhan_husary.mp3',
  abdulbasit:  '/audio/adhan_abdulbasit.mp3',
  makkah:      '/audio/adhan_makkah.mp3',
  madinah:     '/audio/adhan_madinah.mp3',
  europe:      '/audio/adhan_europe.mp3',
};

// CDN fallback if local file fails to load
const CDN_FALLBACKS: Record<string, string> = {
  husary:      'https://www.islamcan.com/audio/adhan/1.mp3',
  abdulbasit:  'https://www.islamcan.com/audio/adhan/2.mp3',
  makkah:      'https://www.islamcan.com/audio/adhan/3.mp3',
  madinah:     'https://www.islamcan.com/audio/adhan/4.mp3',
  europe:      'https://www.islamcan.com/audio/adhan/5.mp3',
};

// ── مدة الأذان ─────────────────────────────────────────────────────
const SILENT_BEEP_URL = '/audio/notification_beep.mp3';
function getAdhanDurationMode(): string {
  return localStorage.getItem('prayer_adhan_duration_mode') || 'full';
}

// ── Callback types ────────────────────────────────────────────────────
export type TickCallback = (info: {
  secondsLeft: number;
  prayerName: string;
  prayerNameAr: string;
  prayerTime: string;
}) => void;

export type AdhanCallback = (info: {
  prayerName: string;
  prayerNameAr: string;
}) => void;

export type AdhanEndCallback = () => void;

// ── Helper: format seconds → "HH:MM:SS" ─────────────────────────────
export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

// ── Singleton AdhanPlayer ─────────────────────────────────────────────
class AdhanPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentMuezzin = '';
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickCallbacks: Set<TickCallback> = new Set();
  private adhanCallbacks: Set<AdhanCallback> = new Set();
  private adhanEndCallbacks: Set<AdhanEndCallback> = new Set();
  private lastPlayedPrayer = '';
  private isPlaying = false;
  /**
   * عندما يكون false، يتخطّى tick() استدعاء triggerManualFallback() تلقائياً
   * عند وصول وقت الصلاة. يُستخدم على أندرويد لأن النظام Native (PrayerAlarm.playAdhan)
   * هو المسؤول عن تشغيل الأذان هناك، فلا حاجة للتشغيل المزدوج من طبقة الويب.
   * الـ tick نفسه يستمر في العمل لإطلاق onTick callbacks (العد التنازلي UI).
   */
  private autoPlayEnabled = true;

  // ── الوضع الصامت: صوت تنبيه متكرر ──
  private silentBeepAudio: HTMLAudioElement | null = null;
  private silentBeepIntervalId: ReturnType<typeof setInterval> | null = null;
  private silentBeepCount = 0;

  // ── الوضع القصير: إيقاف بعد 30 ثانية ──
  private shortModeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // ── Audio management ────────────────────────────────────────────────
  private ensureAudio(): HTMLAudioElement {
    const muezzinId = getSelectedMuezzin();

    if (!this.audio || this.currentMuezzin !== muezzinId) {
      // Stop any current playback
      if (this.audio && !this.audio.paused) {
        this.audio.pause();
        this.audio.currentTime = 0;
      }

      this.currentMuezzin = muezzinId;
      const src = AUDIO_URLS[muezzinId] || AUDIO_URLS['makkah'];

      this.audio = new Audio(src);
      this.audio.preload = 'auto';

      // CDN fallback on error
      this.audio.addEventListener('error', () => {
        if (this.audio) {
          const fallback = CDN_FALLBACKS[muezzinId] || CDN_FALLBACKS['makkah'];
          console.warn(`AdhanPlayer: local file failed, using CDN: ${fallback}`);
          this.audio.src = fallback;
          this.audio.load();
        }
      }, { once: true });

      // Track playing state
      this.audio.addEventListener('play', () => { this.isPlaying = true; });
      this.audio.addEventListener('ended', () => { this.isPlaying = false; });
      this.audio.addEventListener('pause', () => { this.isPlaying = false; });

      this.audio.load();
    }
    return this.audio;
  }

  // ── Calculate next prayer ───────────────────────────────────────────
  private getNextPrayer(): {
    name: string;
    nameAr: string;
    time: string;
    secondsLeft: number;
  } | null {
    const prayers = getPrayerTimingsFromCache();
    if (!prayers) return null;

    const now = new Date();
    const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const name of order) {
      const found = prayers.find(p => p.name === name);
      if (!found) continue;
      const [h, m] = found.time.split(':').map(Number);
      const pSecs = h * 3600 + m * 60;
      if (pSecs > nowSecs) {
        return {
          name,
          nameAr: AR_NAMES[name] || name,
          time: found.time,
          secondsLeft: pSecs - nowSecs,
        };
      }
    }

    // All prayers passed → next is Fajr tomorrow
    const fajr = prayers.find(p => p.name === 'Fajr');
    if (fajr) {
      const [h, m] = fajr.time.split(':').map(Number);
      const pSecs = h * 3600 + m * 60;
      return {
        name: 'Fajr',
        nameAr: AR_NAMES['Fajr'],
        time: fajr.time,
        secondsLeft: 86400 - nowSecs + pSecs,
      };
    }
    return null;
  }

  // ── Start the 1-second heartbeat ────────────────────────────────────
  start(): void {
    if (this.intervalId) return; // already running

    this.ensureAudio(); // preload audio

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    this.tick(); // run immediately
  }

  private tick(): void {
    const next = this.getNextPrayer();
    if (!next) return;

    // Reload audio if muezzin changed
    this.ensureAudio();

    // Fire tick callbacks (for live countdown UI) — يُطلق دائماً على كل المنصات
    this.tickCallbacks.forEach(cb => cb({
      secondsLeft: next.secondsLeft,
      prayerName: next.name,
      prayerNameAr: next.nameAr,
      prayerTime: next.time,
    }));

    // ── Play adhan when prayer time arrives ─────────────────────────
    // Window of 10 seconds to catch slight timer drift
    // يُتجاوز تلقائياً على أندرويد (autoPlayEnabled = false) لأن النظام Native
    // يتولى التشغيل هناك عبر PrayerAlarm.playAdhan()
    if (this.autoPlayEnabled && next.secondsLeft <= 10 && next.name !== this.lastPlayedPrayer) {
      this.lastPlayedPrayer = next.name;
      this.triggerManualFallback(next.name, next.nameAr);
    }
  }

  /**
   * يشغّل الأذان يدوياً ويُطلق onAdhan callbacks.
   * يُستدعى من:
   *   - tick() تلقائياً عند وصول وقت الصلاة (فقط إذا autoPlayEnabled = true، أي على الويب)
   *   - App.tsx في كتلة catch كـ Fallback عند فشل PrayerAlarm.playAdhan() على أندرويد
   *
   * الـ callbacks تُطلق أولاً (قبل محاولة تشغيل الصوت) لضمان ظهور overlay فوراً
   * حتى لو حصل حظر autoplay. الصوت يُعاد تشغيله عند أول تفاعل من المستخدم.
   */
  async triggerManualFallback(prayerName: string, prayerNameAr: string): Promise<void> {
    // أطلق الـ callbacks أولاً — overlay يظهر فوراً قبل محاولة الصوت
    this.adhanCallbacks.forEach(cb => cb({ prayerName, prayerNameAr }));

    const mode = getAdhanDurationMode();

    // ── الوضع الصامت: صوت تنبيه متكرر بدل المؤذن ──
    if (mode === 'silent') {
      this.playSilentBeepRepeat();
      return;
    }

    try {
      const audio = this.ensureAudio();
      audio.currentTime = 0;
      await audio.play();

      // ── الوضع القصير: إيقاف الصوت والكارت بعد 30 ثانية ──
      if (mode === 'short') {
        this.shortModeTimeoutId = setTimeout(() => {
          this.stopAudio();
          this.notifyAdhanEnd();
          // ملاحظة: الـ overlay يختفي لأن stopAudio يغيّر isPlaying لـ false
          // والـ overlay في React غالباً مربوط بحالة الـ audio أو يُغلق يدوياً
          // لكن لضمان الإغلاق التام، نُطلق الـ callbacks بحالة فارغة أو نعتمد على stopAudio
        }, 30_000);
      }
    } catch (err) {
      // Autoplay blocked — will try on next user interaction
      console.warn('AdhanPlayer: autoplay blocked, will retry on user gesture', err);

      // Retry audio playback on next user touch/click (overlay already shown)
      const retryOnInteraction = async () => {
        try {
          const audio = this.ensureAudio();
          audio.currentTime = 0;
          await audio.play();
        } catch { /* ignore */ }
        document.removeEventListener('touchstart', retryOnInteraction);
        document.removeEventListener('click', retryOnInteraction);
      };
      document.addEventListener('touchstart', retryOnInteraction, { once: true });
      document.addEventListener('click', retryOnInteraction, { once: true });
    }
  }

  /**
   * يشغّل صوت تنبيه قصير ويعيده كل 30 ثانية لمدة 3 دقائق (6 تكرارات).
   * بديل شرعي لصوت المؤذن.
   */
  private playSilentBeepRepeat(): void {
    this.silentBeepCount = 1;
    const playBeep = () => {
      try {
        if (!this.silentBeepAudio) {
          this.silentBeepAudio = new Audio(SILENT_BEEP_URL);
          this.silentBeepAudio.preload = 'auto';
        }
        this.silentBeepAudio.currentTime = 0;
        void this.silentBeepAudio.play().catch(() => { /* ignore autoplay block */ });
      } catch { /* ignore */ }
    };

    // أول تشغيل فوري
    playBeep();

    // تكرار كل 30 ثانية — يتوقف بعد 6 تكرارات (3 دقائق) أو عند stopAudio()
    this.silentBeepIntervalId = setInterval(() => {
      this.silentBeepCount++;
      if (this.silentBeepCount > 6) {
        this.stopSilentBeepRepeat();
        this.notifyAdhanEnd();
        return;
      }
      playBeep();
    }, 30_000);
  }

  private stopSilentBeepRepeat(): void {
    if (this.silentBeepIntervalId) {
      clearInterval(this.silentBeepIntervalId);
      this.silentBeepIntervalId = null;
      this.notifyAdhanEnd();
    }
    if (this.silentBeepAudio) {
      try { this.silentBeepAudio.pause(); } catch { /* ignore */ }
      this.silentBeepAudio = null;
    }
    this.silentBeepCount = 0;
  }

  // ── Subscribe / unsubscribe ─────────────────────────────────────────
  onTick(cb: TickCallback): () => void {
    this.tickCallbacks.add(cb);
    return () => this.tickCallbacks.delete(cb);
  }

  onAdhan(cb: AdhanCallback): () => void {
    this.adhanCallbacks.add(cb);
    return () => this.adhanCallbacks.delete(cb);
  }

  onAdhanEnd(cb: AdhanEndCallback): () => void {
    this.adhanEndCallbacks.add(cb);
    return () => this.adhanEndCallbacks.delete(cb);
  }

  private notifyAdhanEnd(): void {
    this.adhanEndCallbacks.forEach(cb => {
      try { cb(); } catch { /* ignore */ }
    });
  }

  // ── Manual controls ─────────────────────────────────────────────────
  stopAudio(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.isPlaying = false;
    this.stopSilentBeepRepeat();
    if (this.shortModeTimeoutId) {
      clearTimeout(this.shortModeTimeoutId);
      this.shortModeTimeoutId = null;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * تحكم في ما إذا كان tick() سيُطلق الأذان تلقائياً عند وصول وقت الصلاة.
   * - على الويب: true (السلوك الافتراضي — لا حاجة لاستدعاء هذه الدالة)
   * - على أندرويد: false (النظام Native يتولى التشغيل عبر PrayerAlarm.playAdhan)
   *
   * الـ tick نفسه (الذي يُطلق onTick للعد التنازلي UI) يستمر في العمل في الحالتين.
   */
  setAutoPlay(enabled: boolean): void {
    this.autoPlayEnabled = enabled;
  }

  // ── Reload audio when muezzin changes ───────────────────────────────
  reloadForNewMuezzin(): void {
    this.currentMuezzin = ''; // force reload
    this.ensureAudio();
  }

  // ── Stop everything ─────────────────────────────────────────────────
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.stopAudio();
    this.tickCallbacks.clear();
    this.adhanCallbacks.clear();
    this.adhanEndCallbacks.clear();
  }
}

// Export singleton
export const adhanPlayer = new AdhanPlayer();
