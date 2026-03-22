// src/hooks/useProgress.ts
// ✅ Full version with Supabase sync for production use

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'user_progress_days';
const NAME_KEY = 'user_name';
const TOTAL_DAYS = 30;

export const useDailyJourney = () => {
  const { user } = useAuth();
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const hasSyncedRef = useRef(false);

  // ─── 🟢 1. Load Initial Data (Local -> Remote) ──────────────────
  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      
      // A. Load from LocalStorage first (for instant UI)
      let local: number[] = [];
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) local = parsed;
        }
      } catch (e) {
        console.warn('Failed to parse local progress', e);
      }
      setCompletedDays(local);

      // B. If logged in, sync with Supabase
      if (!user) {
        hasSyncedRef.current = false;
      }

      if (user && !hasSyncedRef.current) {
        hasSyncedRef.current = true;
        try {
          console.log('Progress: Syncing with Supabase...');
          const { data, error } = await supabase
            .from('user_journey')
            .select('completed_days')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            // Error code 42P01 is "undefined_table" in Postgres/Postgrest
            if ((error as any).code === '42P01') {
              console.warn('Progress: user_journey table does not exist yet. Using local only.');
            } else {
              throw error;
            }
          }

          if (data && data.completed_days) {
            // Merge strategy: Union of local and remote
            const remote: number[] = data.completed_days;
            const merged = Array.from(new Set([...local, ...remote])).sort((a, b) => a - b);
            
            setCompletedDays(merged);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

            // If local was ahead of remote, update remote
            if (local.some(day => !remote.includes(day))) {
               await supabase
                .from('user_journey')
                .upsert({ user_id: user.id, completed_days: merged } as any);
            }
          } else if (user) {
            // No remote data, create it if local exists
            if (local.length > 0) {
              const { error: insertError } = await supabase
                .from('user_journey')
                .upsert({ user_id: user.id, completed_days: local });
              
              if (insertError) {
                if ((insertError as any).code === '42501') {
                  console.warn('Progress: RLS blocking initial journey creation.');
                } else if ((insertError as any).code !== '23505') { // Ignore duplicate key during race condition
                  console.error('Failed to initialize journey', insertError);
                }
              }
            }
          }
        } catch (err) {
          console.error('Progress: Supabase sync failed. Falling back to local.', err);
        }
      }
      setLoading(false);
    };

    loadProgress();
  }, [user]);

  // ─── 🟢 2. Mark a day complete ───────────────────────────────────
  const completeDay = async (day: number) => {
    const updated = Array.from(new Set([...completedDays, day])).sort((a, b) => a - b);
    setCompletedDays(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (user) {
      try {
        const { error } = await supabase
          .from('user_journey')
          .upsert({ 
            user_id: user.id, 
            completed_days: updated,
            updated_at: new Date().toISOString() 
          });
        if (error) {
          if ((error as any).code === '42501') {
            console.warn('Progress: RLS policy blocking upsert.');
          } else if ((error as any).code !== '42P01') {
            console.error('Progress: Failed to save to Supabase', error);
          }
        }
      } catch (err) {
        console.error('Progress: Unexpected error saving to Supabase', err);
      }
    }
  };

  const isCompleted = (day: number) => completedDays.includes(day);

  // ─── Current day = First incomplete day ──────────────────────
  let currentDay = 1;
  for (let i = 1; i <= TOTAL_DAYS; i++) {
    if (!completedDays.includes(i)) { 
      currentDay = i; 
      break; 
    }
    if (i === TOTAL_DAYS) currentDay = TOTAL_DAYS;
  }

  const progressPercent = Math.round(
    (Math.min(completedDays.length, TOTAL_DAYS) / TOTAL_DAYS) * 100
  );

  const userName = localStorage.getItem(NAME_KEY) || (user?.user_metadata?.full_name) || 'Brother/Sister';

  return {
    completedDays,
    currentDay,
    progressPercent,
    completeDay,
    isCompleted,
    userName,
    loading,
  };
};
