package com.islame.app.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.islame.app.plugins.IqamaPlayerService;
import com.islame.app.storage.PrayerDataStore;

public class IqamaAlarmReceiver extends BroadcastReceiver {

    private static final String[][] AR_MAP = {
        {"Fajr","الفجر"}, {"Dhuhr","الظهر"}, {"Asr","العصر"},
        {"Maghrib","المغرب"}, {"Isha","العشاء"}
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        String name = intent.getStringExtra("prayer_name");
        PrayerDataStore store = new PrayerDataStore(context);

        if (!store.isNotificationsEnabled() || store.isPrayerMuted(name)) return;

        String prayerNameAr = name != null ? name : "الصلاة";
        for (String[] pair : AR_MAP) {
            if (pair[0].equals(name)) { prayerNameAr = pair[1]; break; }
        }

        try {
            Intent iqamaIntent = new Intent(context, IqamaPlayerService.class);
            iqamaIntent.putExtra(IqamaPlayerService.EXTRA_PRAYER_AR, prayerNameAr);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(iqamaIntent);
            } else {
                context.startService(iqamaIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
