package com.islame.app.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.islame.app.service.PrayerCountdownService;
import com.islame.app.storage.PrayerDataStore;

public class ServiceRestartReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        PrayerDataStore store = new PrayerDataStore(context);
        if (!store.isNotificationsEnabled()) return;

        Intent serviceIntent = new Intent(context, PrayerCountdownService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
