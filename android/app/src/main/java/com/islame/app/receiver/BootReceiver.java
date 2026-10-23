package com.islame.app.receiver;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.islame.app.scheduler.PrayerScheduler;
import com.islame.app.worker.PrayerCountdownWorker;
import com.islame.app.worker.PrayerRescheduleWorker;
import com.islame.app.service.PrayerCountdownService;
import com.islame.app.storage.PrayerDataStore;
import android.os.Build;
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            "android.intent.action.MY_PACKAGE_REPLACED".equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            PrayerScheduler.scheduleNextAlarms(context);
            PrayerCountdownWorker.start(context);
            PrayerRescheduleWorker.start(context);
            PrayerDataStore store = new PrayerDataStore(context);
            if (store.isNotificationsEnabled()) {
                Intent serviceIntent = new Intent(context, PrayerCountdownService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            }
        }
    }
}
