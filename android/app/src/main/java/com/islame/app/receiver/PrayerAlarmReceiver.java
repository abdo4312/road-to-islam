package com.islame.app.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.islame.app.scheduler.PrayerScheduler;
import com.islame.app.service.PrayerCountdownService;
import com.islame.app.storage.PrayerDataStore;
import com.islame.app.plugins.AdhanPlayerService;

public class PrayerAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String name = intent.getStringExtra("prayer_name");
        PrayerDataStore store = new PrayerDataStore(context);
        
        if (!store.isNotificationsEnabled() || store.isPrayerMuted(name)) return;

        String rawMuezzin = store.getSelectedMuezzin();
        String muezzinId = (rawMuezzin != null && rawMuezzin.startsWith("adhan_"))
            ? rawMuezzin : "adhan_" + (rawMuezzin != null ? rawMuezzin : "makkah");

        // ✅ تم حذف بناء الإشعار المستقل نهائياً — الإشعار شبحي الآن من AdhanPlayerService.
        // الإبقاء فقط على منطق بدء الخدمة + إعادة الجدولة.

        // Start AdhanPlayerService to play sound in foreground with controls
        try {
            Intent adhanIntent = new Intent(context, AdhanPlayerService.class);
            adhanIntent.putExtra(AdhanPlayerService.EXTRA_MUEZZIN,    muezzinId);
            adhanIntent.putExtra(AdhanPlayerService.EXTRA_PRAYER,     name);
            final String[][] AR_MAP = {
                {"Fajr","الفجر"}, {"Dhuhr","الظهر"}, {"Asr","العصر"},
                {"Maghrib","المغرب"}, {"Isha","العشاء"}
            };
            String prayerNameAr = name != null ? name : "";
            for (String[] pair : AR_MAP) {
                if (pair[0].equals(name)) { prayerNameAr = pair[1]; break; }
            }
            adhanIntent.putExtra(AdhanPlayerService.EXTRA_PRAYER_AR, prayerNameAr);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(adhanIntent);
            } else {
                context.startService(adhanIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // ✅ تم حذف manager.notify(name.hashCode() + 1000, builder.build()) نهائياً.

        // بعد دق الأذان — أعد جدولة الصلوات التالية واستأنف الـ countdown
        PrayerScheduler.scheduleNextAlarms(context);

        Intent serviceIntent = new Intent(context, PrayerCountdownService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
