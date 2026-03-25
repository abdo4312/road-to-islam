import { useState, useEffect } from 'react';
import { fetchPrayerData, fetchPrayerDataByCoords, PrayerAPIResponse, HijriDate, PrayerTimes } from '../services/prayerAPI';
import { getCurrentLocation } from '../lib/location';

export interface PrayerData {
  name: string;
  time: string;
  status: 'past' | 'current' | 'upcoming';
}

interface UsePrayerTimesResult {
  prayers: PrayerData[];
  nextPrayer: PrayerData | null;
  countdown: string;
  city: string;
  hijriDateStr: string;
  gregorianDateStr: string;
  isLoading: boolean;
  error: string | null;
}

interface PrayerStatusResult {
  prayers: PrayerData[];
  nextPrayer: PrayerData | null;
  nextPTimeInMinutes: number;
}

const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

const parseTimeToMinutes = (time: string): number | null => {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

const formatCountdown = (diffMins: number): string => {
  const safeDiff = Math.max(0, diffMins);
  const hrs = Math.floor(safeDiff / 60);
  const mins = safeDiff % 60;
  return `${hrs}h ${mins}m`;
};

const getDateKey = (): string => new Date().toISOString().split('T')[0];

export const calculatePrayerStatus = (
  timings: PrayerTimes,
  _hijri: HijriDate,
  _readable: string,
  _locationCity: string
): PrayerStatusResult => {
  const now = new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers: PrayerData[] = [];
  let nextPrayer: PrayerData | null = null;
  let nextPTimeInMinutes = -1;
  let currentPrayerName: string | null = null;

  for (const name of PRAYER_ORDER) {
    const time = timings[name];
    if (!time) continue;

    const timeInMinutes = parseTimeToMinutes(time);
    if (timeInMinutes === null) continue;

    let status: PrayerData['status'] = 'upcoming';
    if (timeInMinutes <= currentTimeInMinutes) {
      status = 'past';
    } else if (!nextPrayer && name !== 'Sunrise') {
      // الصلاة القادمة هي التي تُعتبر "current"
      nextPrayer = { name, time, status: 'current' };
      nextPTimeInMinutes = timeInMinutes;
      currentPrayerName = name;
    }

    prayers.push({ name, time, status });
  }

  if (currentPrayerName) {
    const currentIdx = prayers.findIndex((p) => p.name === currentPrayerName);
    if (currentIdx !== -1) {
      prayers[currentIdx].status = 'current';
    }
  }

  if (!nextPrayer) {
    const fajrTime = timings.Fajr;
    const fajrMins = parseTimeToMinutes(fajrTime);
    if (fajrMins !== null) {
      nextPrayer = { name: 'Fajr', time: fajrTime, status: 'upcoming' };
      nextPTimeInMinutes = fajrMins + 24 * 60;
    }
  }

  return { prayers, nextPrayer, nextPTimeInMinutes };
};

export const usePrayerTimes = (): UsePrayerTimesResult => {
  const [prayers, setPrayers] = useState<PrayerData[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerData | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [city, setCity] = useState<string>('Mecca');
  const [hijriDateStr, setHijriDateStr] = useState<string>('');
  const [gregorianDateStr, setGregorianDateStr] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let countdownIntervalId: number | null = null;
    let midnightTimeoutId: number | null = null;
    let isMounted = true;
    let isFetching = false;
    let latestPrayerData: PrayerAPIResponse | null = null;
    let latestCity = localStorage.getItem('user_city') || 'London';
    let latestDateKey = getDateKey();

    const applyPrayerState = (data: PrayerAPIResponse, locationCity: string) => {
      const { prayers: nextPrayers, nextPrayer: nextPrayerData, nextPTimeInMinutes } =
        calculatePrayerStatus(data.timings, data.date.hijri, data.date.readable, locationCity);

      const currentMins = new Date().getHours() * 60 + new Date().getMinutes();
      let diffMins = nextPTimeInMinutes - currentMins;
      if (diffMins < 0) diffMins += 24 * 60;

      if (!isMounted) return;

      setPrayers(nextPrayers);
      setNextPrayer(nextPrayerData);
      setCity(locationCity);
      setHijriDateStr(`${data.date.hijri.day} ${data.date.hijri.month.en} ${data.date.hijri.year} AH`);
      setGregorianDateStr(data.date.readable);
      setCountdown(formatCountdown(diffMins));
    };

    const refreshTick = async () => {
      if (!latestPrayerData || !isMounted) return;

      const todayKey = getDateKey();
      if (todayKey !== latestDateKey) {
        await loadData(true);
        return;
      }

      applyPrayerState(latestPrayerData, latestCity);
    };

    const scheduleMidnightRefresh = () => {
      if (midnightTimeoutId !== null) {
        clearTimeout(midnightTimeoutId);
      }

      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();

      midnightTimeoutId = window.setTimeout(async () => {
        await loadData(true);
        scheduleMidnightRefresh();
      }, msUntilMidnight);
    };

    const loadData = async (forceRefresh = false) => {
      if (isFetching) return;
      isFetching = true;

      try {
        if (!latestPrayerData || forceRefresh) {
          setIsLoading(true);
        }
        setError(null);

        const today = getDateKey();
        latestDateKey = today;

        let currentCity = localStorage.getItem('user_city') || 'London';
        let currentCountry = localStorage.getItem('user_country') || 'UK';

        let cachedData: PrayerAPIResponse | null = null;
        if (!forceRefresh) {
          const cachedRaw = localStorage.getItem(`prayer_data_${today}`);
          if (cachedRaw) {
            try {
              cachedData = JSON.parse(cachedRaw) as PrayerAPIResponse;
            } catch (parseErr) {
              console.warn('Invalid cached prayer data, fetching fresh data.', parseErr);
            }
          }
        }

        if (!cachedData) {
          let coordsToUse: { latitude: number; longitude: number } | null = null;
          
          try {
            const coords = await getCurrentLocation();
            coordsToUse = coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
            );
            const geoData = await response.json();
            currentCity = geoData.address?.city || geoData.address?.town || geoData.address?.village || currentCity;
            currentCountry = geoData.address?.country || currentCountry;
            localStorage.setItem('user_city', currentCity);
            localStorage.setItem('user_country', currentCountry);
            localStorage.setItem('user_lat', coords.latitude.toString());
            localStorage.setItem('user_lon', coords.longitude.toString());
          } catch (geoErr) {
            console.warn('Geolocation skipped or failed, using stored defaults.', geoErr);
            const lat = localStorage.getItem('user_lat');
            const lon = localStorage.getItem('user_lon');
            if (lat && lon) {
               coordsToUse = { latitude: parseFloat(lat), longitude: parseFloat(lon) };
            }
          }

          if (coordsToUse) {
            cachedData = await fetchPrayerDataByCoords(coordsToUse.latitude, coordsToUse.longitude);
          } else {
            cachedData = await fetchPrayerData(currentCity, currentCountry);
          }
          localStorage.setItem(`prayer_data_${today}`, JSON.stringify(cachedData));
        }

        latestPrayerData = cachedData;
        latestCity = currentCity;

        applyPrayerState(cachedData, currentCity);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isFetching = false;
      }
    };

    const init = async () => {
      await loadData();
      if (!isMounted) return;

      countdownIntervalId = window.setInterval(() => {
        void refreshTick();
      }, 60000);
      scheduleMidnightRefresh();
    };

    void init();

    return () => {
      isMounted = false;
      if (countdownIntervalId !== null) clearInterval(countdownIntervalId);
      if (midnightTimeoutId !== null) clearTimeout(midnightTimeoutId);
    };
  }, []);

  return { prayers, nextPrayer, countdown, city, hijriDateStr, gregorianDateStr, isLoading, error };
};
