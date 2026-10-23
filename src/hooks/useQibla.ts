import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentLocation } from '../lib/location';

interface DeviceOrientationEventWithWebkit extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface UseQiblaResult {
  qiblaAngle: number;
  deviceHeading: number;
  rotationNeeded: number;
  distance: number;
  city: string;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

const FILTER_ALPHA = 0.18;
const DEAD_ZONE_DEGREES = 0.8;
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const normalizeAngle = (deg: number) => ((deg % 360) + 360) % 360;

const shortestAngleDiff = (from: number, to: number) => {
  let diff = normalizeAngle(from - to);
  if (diff > 180) diff -= 360;
  return diff;
};

const calculateQiblaBearing = (lat: number, lon: number) => {
  const phi1 = toRad(lat);
  const lambda1 = toRad(lon);
  const phi2 = toRad(KAABA_LAT);
  const lambda2 = toRad(KAABA_LON);
  const deltaLambda = lambda2 - lambda1;

  const theta = Math.atan2(
    Math.sin(deltaLambda),
    Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda)
  );

  return normalizeAngle(toDeg(theta));
};

const calculateDistanceKm = (lat: number, lon: number) => {
  const earthRadiusKm = 6371;
  const dLat = toRad(KAABA_LAT - lat);
  const dLon = toRad(KAABA_LON - lon);
  const lat1 = toRad(lat);
  const lat2 = toRad(KAABA_LAT);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c);
};

export const useQibla = (): UseQiblaResult => {
  const [qiblaAngle, setQiblaAngle] = useState<number>(0);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [city, setCity] = useState<string>('Detecting...');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const filteredVectorRef = useRef<{ x: number; y: number } | null>(null);
  const lastHeadingRef = useRef<number | null>(null);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setIsSupported(true);
    filteredVectorRef.current = null;
    lastHeadingRef.current = null;
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    const orientationListeners: Array<{ event: string; fn: EventListenerOrEventListenerObject }> = [];

    const initQibla = async () => {
      try {
        const { latitude: lat, longitude: lon } = await getCurrentLocation();

        if (!mounted) return;

        // Reverse geocoding
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const locationName =
              geoData.address?.city ||
              geoData.address?.town ||
              geoData.address?.village ||
              'Unknown Location';
            const countryCode = geoData.address?.country_code?.toUpperCase() || '';
            setCity(`${locationName}${countryCode ? `, ${countryCode}` : ''}`);
          }
        } catch {
          setCity(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        }

        setQiblaAngle(calculateQiblaBearing(lat, lon));
        setDistance(calculateDistanceKm(lat, lon));

        setIsLoading(false);

        if ('DeviceOrientationEvent' in window) {
          const handleOrientation = (event: Event) => {
            if (!mounted) return;
            const e = event as DeviceOrientationEventWithWebkit;

            let rawHeading = 0;

            if (e.webkitCompassHeading != null) {
              // ✅ iOS — webkitCompassHeading بيجيب الـ heading صح مباشرة
              rawHeading = e.webkitCompassHeading;
            } else if (e.alpha != null) {
              // ✅ Android (absolute أو relative) — alpha دايماً عكس عقارب الساعة
              // سواء كان deviceorientationabsolute أو deviceorientation
              // الصيغة الصح دايماً: 360 - alpha
              rawHeading = 360 - e.alpha;
            } else {
              return;
            }

            rawHeading = normalizeAngle(rawHeading);
            if (!Number.isFinite(rawHeading)) return;

            const rad = toRad(rawHeading);
            const rawX = Math.cos(rad);
            const rawY = Math.sin(rad);

            if (!filteredVectorRef.current) {
              filteredVectorRef.current = { x: rawX, y: rawY };
            } else {
              filteredVectorRef.current = {
                x: filteredVectorRef.current.x * (1 - FILTER_ALPHA) + rawX * FILTER_ALPHA,
                y: filteredVectorRef.current.y * (1 - FILTER_ALPHA) + rawY * FILTER_ALPHA,
              };
            }

            const smoothed = normalizeAngle(
              toDeg(Math.atan2(filteredVectorRef.current.y, filteredVectorRef.current.x))
            );

            if (lastHeadingRef.current != null) {
              const change = Math.abs(shortestAngleDiff(smoothed, lastHeadingRef.current));
              if (change < DEAD_ZONE_DEGREES) return;
            }

            lastHeadingRef.current = smoothed;
            setDeviceHeading(Math.round(smoothed));
          };

          // ✅ استخدم deviceorientationabsolute لو متاح — بيجيب heading من الشمال الجغرافي
          // لو مش متاح استخدم deviceorientation — بيجيب heading نسبي (أقل دقة)
          const orientationEntry = {
            event:
              'ondeviceorientationabsolute' in window
                ? 'deviceorientationabsolute'
                : 'deviceorientation',
            fn: handleOrientation as EventListenerOrEventListenerObject,
          };
          window.addEventListener(orientationEntry.event, orientationEntry.fn, true);
          orientationListeners.push(orientationEntry);
        } else {
          setIsSupported(false);
        }
      } catch (err) {
        if (!mounted) return;

        let errorMessage = 'An error occurred determining Qibla.';
        if (err && typeof err === 'object' && 'code' in err && typeof (err as any).code === 'number') {
          const code = (err as GeolocationPositionError).code;
          if (code === 1) {
            errorMessage =
              'Location permission denied. Please enable location access in your settings, then try again.';
          } else if (code === 2) {
            errorMessage = 'Your location is currently unavailable. Please try again.';
          } else if (code === 3) {
            errorMessage = 'Location request timed out. Please check your connection and try again.';
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setIsLoading(false);
        setIsSupported(false);
      }
    };

    initQibla();

    return () => {
      mounted = false;
      for (const { event, fn } of orientationListeners) {
        window.removeEventListener(event, fn, true);
      }
    };
  }, [retryKey]);

  let rotationNeeded = shortestAngleDiff(qiblaAngle, deviceHeading);
  if (!isSupported && qiblaAngle) rotationNeeded = qiblaAngle;

  return {
    qiblaAngle,
    deviceHeading,
    rotationNeeded,
    distance,
    city,
    isSupported,
    isLoading,
    error,
    retry,
  };
};