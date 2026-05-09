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
  private lastPlayedPrayer = '';
  private isPlaying = false;

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

    // Fire tick callbacks (for live countdown UI)
    this.tickCallbacks.forEach(cb => cb({
      secondsLeft: next.secondsLeft,
      prayerName: next.name,
      prayerNameAr: next.nameAr,
      prayerTime: next.time,
    }));

    // ── Play adhan when prayer time arrives ─────────────────────────
    // Window of 10 seconds to catch slight timer drift
    if (next.secondsLeft <= 10 && next.name !== this.lastPlayedPrayer) {
      this.lastPlayedPrayer = next.name;
      this.triggerAdhan(next.name, next.nameAr);
    }
  }

  private async triggerAdhan(prayerName: string, prayerNameAr: string): Promise<void> {
    try {
      const audio = this.ensureAudio();
      audio.currentTime = 0;
      await audio.play();

      // Notify all adhan callbacks
      this.adhanCallbacks.forEach(cb => cb({ prayerName, prayerNameAr }));

    } catch (err) {
      // Autoplay blocked — will try on next user interaction
      console.warn('AdhanPlayer: autoplay blocked, will retry on user gesture', err);

      // Store pending adhan and retry on next user touch
      const retryOnInteraction = async () => {
        try {
          const audio = this.ensureAudio();
          audio.currentTime = 0;
          await audio.play();
          this.adhanCallbacks.forEach(cb => cb({ prayerName, prayerNameAr }));
        } catch { /* ignore */ }
        document.removeEventListener('touchstart', retryOnInteraction);
        document.removeEventListener('click', retryOnInteraction);
      };
      document.addEventListener('touchstart', retryOnInteraction, { once: true });
      document.addEventListener('click', retryOnInteraction, { once: true });
    }
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

  // ── Manual controls ─────────────────────────────────────────────────
  stopAudio(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
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
  }
}

// Export singleton
export const adhanPlayer = new AdhanPlayer();
