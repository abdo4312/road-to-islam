export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

export interface HijriDate {
  date: string;
  day: string;
  month: { en: string; ar: string };
  year: string;
}

export interface PrayerAPIResponse {
  timings: PrayerTimes;
  date: {
    readable: string;
    hijri: HijriDate;
  };
}

export const fetchPrayerData = async (city: string, country: string): Promise<PrayerAPIResponse> => {
  const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=3`);
  if (!response.ok) {
    throw new Error('Failed to fetch prayer data');
  }
  const result = await response.json();
  return result.data;
};
