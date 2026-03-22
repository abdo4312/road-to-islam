import { Capacitor } from '@capacitor/core';

export async function initializePushNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  console.log('Push notifications: temporarily disabled pending Firebase setup');
}
