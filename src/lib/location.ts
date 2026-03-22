import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface LocationResult {
  latitude: number;
  longitude: number;
}

export async function getCurrentLocation(): Promise<LocationResult> {
  if (Capacitor.isNativePlatform()) {
    // ── Android/iOS: استخدم Capacitor plugin ──────────────
    const permission = await Geolocation.requestPermissions();

    if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
      throw new Error('Location permission denied. Please enable location access in your settings, then try again.');
    }

    const position = await Geolocation.getCurrentPosition({
      timeout: 10000,
      enableHighAccuracy: true,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } else {
    // ── Web: استخدم browser API ───────────────────────────
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          if (err.code === 1) {
            reject(new Error('Location permission denied. Please enable location access in your settings, then try again.'));
          } else {
            reject(new Error('Unable to determine your location. Please try again.'));
          }
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }
}