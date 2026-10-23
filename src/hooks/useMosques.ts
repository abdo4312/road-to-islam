import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../lib/location';

export interface Mosque {
  id: number;
  lat: number;
  lon: number;
  name: string;
  address: string;
  distanceMeter: number;
  tags: string[];
}

interface UseMosquesResult {
  mosques: Mosque[];
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  isLoading: boolean;
  error: string | null;
  userLat: number | null;
  userLon: number | null;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const useMosques = (): UseMosquesResult => {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const findMosques = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // ✅ FIX: use local variables instead of reading state after setting it.
        // State updates are async — reading userLat/userLon immediately after
        // setUserLat/setUserLon would still return the old (null) value.
        let lat = userLat;
        let lon = userLon;

        if (lat === null || lon === null) {
          const coords = await getCurrentLocation();
          if (!mounted) return;

          // Store in local vars first, then sync state
          lat = coords.latitude;
          lon = coords.longitude;
          setUserLat(lat);
          setUserLon(lon);
        }

        const radiusMeters = radiusKm * 1000;
        const query = `[out:json];node[amenity=place_of_worship][religion=muslim](around:${radiusMeters},${lat},${lon});out;`;

        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        });

        if (!res.ok) throw new Error('Failed to fetch mosques');
        const data = await res.json();

        if (!mounted) return;

        const results: Mosque[] = data.elements.map((el: any) => {
          const dist = calculateDistance(lat!, lon!, el.lat, el.lon);
          const tagsStr: string[] = [];

          if (el.tags?.wheelchair === 'yes') tagsStr.push('Wheelchair Access');
          if (el.tags?.opening_hours) tagsStr.push('Open Hours');
          if (el.tags?.building === 'mosque') tagsStr.push('Official Mosque');
          if (tagsStr.length === 0) tagsStr.push('Prayer Room');

          let address = '';
          if (el.tags['addr:street']) address += el.tags['addr:street'];
          if (el.tags['addr:housenumber'])
            address = el.tags['addr:housenumber'] + ' ' + address;
          if (el.tags['addr:city'])
            address += (address ? ', ' : '') + el.tags['addr:city'];

          return {
            id: el.id,
            lat: el.lat,
            lon: el.lon,
            name: el.tags?.name || el.tags?.['name:en'] || 'Unnamed Mosque',
            address: address || 'Address not listed',
            distanceMeter: dist,
            tags: tagsStr,
          };
        });

        const cleanResults = results
          .filter(m => m.distanceMeter <= radiusMeters)
          .sort((a, b) => a.distanceMeter - b.distanceMeter);

        setMosques(cleanResults);
        setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    };

    findMosques();
    return () => { mounted = false; };
  }, [radiusKm, userLat, userLon]);

  return { mosques, radiusKm, setRadiusKm, isLoading, error, userLat, userLon };
};