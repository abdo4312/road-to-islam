import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';

export async function initializePushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // طلب الإذن
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      console.warn('Push: permission denied');
      return;
    }

    // تسجيل الجهاز
    await PushNotifications.register();

    // استقبال الـ FCM token
    await PushNotifications.addListener('registration', async (token) => {
      console.log('FCM Token:', token.value);
      await saveFcmToken(token.value);
    });

    // استقبال الإشعارات وهو مفتوح
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
    });

    // لما المستخدم يضغط الإشعار
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action:', action);
      // ممكن تضيف navigation هنا حسب الـ notification data
    });

  } catch (err) {
    console.warn('Push: initialization failed', err);
  }
}

async function saveFcmToken(token: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // خزّن الـ token محلياً عشان تتجنب طلبات Supabase زيادة
    const stored = localStorage.getItem('fcm_token');
    if (stored === token) return; // نفس الـ token — مش محتاج تحديث

    await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', session.user.id);

    localStorage.setItem('fcm_token', token);
    console.log('FCM token saved to Supabase');
  } catch (err) {
    console.warn('Push: failed to save FCM token', err);
  }
}
