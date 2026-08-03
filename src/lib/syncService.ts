import { supabase } from './supabase';

// ─── Cache keys ───────────────────────────────────────────────
const CACHE_KEYS = {
  subjects:      'cache_subjects',
  lectures:      'cache_lectures',
  progress:      'user_progress_days',
  notifications: 'cache_notifications',
  lastSync:      'last_sync_time',
};

const CACHE_TTL_FRESH  = 1000 * 60 * 5;       // 5 دقايق — يجيب من النت
const CACHE_TTL_STALE  = 1000 * 60 * 60 * 24;  // 24 ساعة — يعرض offline

function isCacheFresh(key: string): boolean {
  const lastSync = localStorage.getItem(CACHE_KEYS.lastSync + '_' + key);
  if (!lastSync) return false;
  return Date.now() - parseInt(lastSync) < CACHE_TTL_FRESH;
}

function isCacheStale(key: string): boolean {
  const lastSync = localStorage.getItem(CACHE_KEYS.lastSync + '_' + key);
  if (!lastSync) return false;
  return Date.now() - parseInt(lastSync) < CACHE_TTL_STALE;
}

function isOnline(): boolean {
  return navigator.onLine;
}

function setCacheTime(key: string) {
  localStorage.setItem(CACHE_KEYS.lastSync + '_' + key, Date.now().toString());
}

// ─── Sync subjects ─────────────────────────────────────────────
async function syncSubjects(): Promise<void> {
  if (isCacheFresh('subjects')) return;
  if (!isOnline() && isCacheStale('subjects')) return;
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) throw error;
    if (data) {
      localStorage.setItem(CACHE_KEYS.subjects, JSON.stringify(data));
      setCacheTime('subjects');
    }
  } catch (err) {
    console.warn('Sync: subjects failed', err);
  }
}

// ─── Sync lectures ─────────────────────────────────────────────
async function syncLectures(): Promise<void> {
  if (isCacheFresh('lectures')) return;
  if (!isOnline() && isCacheStale('lectures')) return;
  try {
    const { data, error } = await supabase
      .from('lectures')
      .select('id, title, subject_id, order_index, duration_min, thumbnail_url, is_published')
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .limit(100);
    if (error) throw error;
    if (data) {
      localStorage.setItem(CACHE_KEYS.lectures, JSON.stringify(data));
      setCacheTime('lectures');
    }
  } catch (err) {
    console.warn('Sync: lectures failed', err);
  }
}

// ─── Sync progress ─────────────────────────────────────────────
async function syncProgress(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('user_journey')
      .select('completed_days')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && (error as any).code !== '42P01') throw error;

    if (data?.completed_days) {
      const local = JSON.parse(localStorage.getItem('user_progress_days') || '[]');
      const merged = Array.from(new Set([...local, ...data.completed_days])).sort((a: number, b: number) => a - b);
      localStorage.setItem('user_progress_days', JSON.stringify(merged));
    }
  } catch (err) {
    console.warn('Sync: progress failed', err);
  }
}

// ─── Sync notifications ────────────────────────────────────────
async function syncNotifications(userId: string): Promise<void> {
  if (isCacheFresh('notifications')) return;
  if (!isOnline() && isCacheStale('notifications')) return;
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    if (data) {
      localStorage.setItem(CACHE_KEYS.notifications, JSON.stringify(data));
      setCacheTime('notifications');
    }
  } catch (err) {
    console.warn('Sync: notifications failed', err);
  }
}

// ─── Sync profile ──────────────────────────────────────────────
async function syncProfile(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    if (data) {
      localStorage.setItem('cached_profile', JSON.stringify(data));
      localStorage.setItem('user_name', data.full_name || '');
    }
  } catch (err) {
    console.warn('Sync: profile failed', err);
  }
}

// ─── Main sync function ────────────────────────────────────────
import type { Session } from '@supabase/supabase-js';

export async function runStartupSync(existingSession?: Session | null): Promise<void> {
  try {
    let session = existingSession;
    if (session === undefined) {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    }

    if (session?.user) {
      // مستخدم مسجّل — sync كل حاجة بالتوازي
      await Promise.allSettled([
        syncSubjects(),
        syncLectures(),
        syncProgress(session.user.id),
        syncNotifications(session.user.id),
        syncProfile(session.user.id),
      ]);
    } else {
      // مش مسجّل — sync المحتوى العام بس
      await Promise.allSettled([
        syncSubjects(),
        syncLectures(),
      ]);
    }

    console.log('Sync: startup sync complete');
  } catch (err) {
    console.warn('Sync: startup sync failed', err);
  }
}

// ─── Resume sync (لما التطبيق يرجع من الخلفية) ────────────────
export async function runResumeSync(): Promise<void> {
  // امسح الـ cache عشان يجيب بيانات جديدة
  Object.values(CACHE_KEYS).forEach(key => {
    if (key.startsWith('cache_')) localStorage.removeItem(key);
  });

  await runStartupSync();
}
