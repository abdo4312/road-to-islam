// src/hooks/useLiveCountdown.ts
import { useState, useEffect } from 'react';
import { adhanPlayer, formatSeconds, TickCallback, AdhanCallback } from '../lib/adhanPlayer';

export interface LiveCountdownState {
  countdown: string;       // "01:23:45" — updates every second
  prayerName: string;      // "Fajr"
  prayerNameAr: string;    // "الفجر"
  prayerTime: string;      // "05:17"
  isAdhanTime: boolean;    // true when adhan is playing/triggered
  adhanPrayerName: string; // which prayer's adhan is playing
}

export function useLiveCountdown(): LiveCountdownState {
  const [countdown, setCountdown] = useState('00:00:00');
  const [prayerName, setPrayerName] = useState('');
  const [prayerNameAr, setPrayerNameAr] = useState('');
  const [prayerTime, setPrayerTime] = useState('');
  const [isAdhanTime, setIsAdhanTime] = useState(false);
  const [adhanPrayerName, setAdhanPrayerName] = useState('');

  useEffect(() => {
    const tickHandler: TickCallback = ({ secondsLeft, prayerName: name, prayerNameAr: nameAr, prayerTime: time }) => {
      setCountdown(formatSeconds(secondsLeft));
      setPrayerName(name);
      setPrayerNameAr(nameAr);
      setPrayerTime(time);
    };

    const adhanHandler: AdhanCallback = ({ prayerName: name, prayerNameAr: nameAr }) => {
      setIsAdhanTime(true);
      setAdhanPrayerName(nameAr || name);
      // Auto-reset after 6 minutes (adhan duration)
      setTimeout(() => setIsAdhanTime(false), 6 * 60 * 1000);
    };

    const unsubTick = adhanPlayer.onTick(tickHandler);
    const unsubAdhan = adhanPlayer.onAdhan(adhanHandler);

    return () => {
      unsubTick();
      unsubAdhan();
    };
  }, []);

  return { countdown, prayerName, prayerNameAr, prayerTime, isAdhanTime, adhanPrayerName };
}
