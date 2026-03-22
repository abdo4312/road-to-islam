import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LocationData {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}

export function useLocationMatch() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocationAndUpdateProfile = async () => {
      try {
        setLoading(true);
        // Using a free IP to Location API
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.error) {
          throw new Error(data.reason);
        }

        const newLocation = {
          country: data.country_name,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
        };

        setLocation(newLocation);

        // Update Supabase profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({
              country: newLocation.country,
              city: newLocation.city,
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            })
            .eq('id', user.id);
        }
      } catch (err: any) {
        console.error('Error fetching location:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationAndUpdateProfile();
  }, []);

  return { location, loading, error };
}
