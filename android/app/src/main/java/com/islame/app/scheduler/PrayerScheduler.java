package com.islame.app.scheduler;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.islame.app.receiver.IqamaAlarmReceiver;
import com.islame.app.receiver.PrayerAlarmReceiver;
import com.islame.app.storage.PrayerDataStore;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class PrayerScheduler {

    public static void scheduleNextAlarms(Context context) {
        PrayerDataStore store = new PrayerDataStore(context);
        if (!store.isNotificationsEnabled()) {
            cancelAllAlarms(context);
            return;
        }

        try {
            JSONArray prayers = new JSONArray(store.getPrayersJson());
            if (prayers.length() == 0) return;

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            long now = System.currentTimeMillis();
            SimpleDateFormat sdf = new SimpleDateFormat("HH:mm", Locale.US);

            for (int i = 0; i < prayers.length(); i++) {
                JSONObject p = prayers.getJSONObject(i);
                String name = p.getString("name");
                String timeStr = p.getString("time");

                if (store.isPrayerMuted(name)) continue;

                Calendar cal = Calendar.getInstance();
                String[] parts = timeStr.split(":");
                cal.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0]));
                cal.set(Calendar.MINUTE, Integer.parseInt(parts[1]));
                cal.set(Calendar.SECOND, 0);
                cal.set(Calendar.MILLISECOND, 0);

                // If time already passed today, schedule for tomorrow
                if (cal.getTimeInMillis() <= now) {
                    cal.add(Calendar.DAY_OF_YEAR, 1);
                }

                Intent intent = new Intent(context, PrayerAlarmReceiver.class);
                intent.putExtra("prayer_name", name);
                intent.putExtra("prayer_time", timeStr);
                
                int requestCode = name.hashCode();
                PendingIntent pi = PendingIntent.getBroadcast(
                    context, requestCode, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
                );

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
                }

                // ── جدولة الإقامة (prayer_time + iqamaDelay) ──────────────
                int iqamaDelayMinutes = store.getIqamaDelay(); // default 10 دقايق
                Calendar iqamaCal = (Calendar) cal.clone();
                iqamaCal.add(Calendar.MINUTE, iqamaDelayMinutes);

                Intent iqamaIntent = new Intent(context, IqamaAlarmReceiver.class);
                iqamaIntent.putExtra("prayer_name", name);

                // requestCode مختلف (+5000) عشان ما يتداخلش مع requestCode الأذان
                int iqamaRequestCode = name.hashCode() + 5000;
                PendingIntent iqamaPi = PendingIntent.getBroadcast(
                    context, iqamaRequestCode, iqamaIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
                );

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, iqamaCal.getTimeInMillis(), iqamaPi);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, iqamaCal.getTimeInMillis(), iqamaPi);
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public static void cancelAllAlarms(Context context) {
        PrayerDataStore store = new PrayerDataStore(context);
        try {
            JSONArray prayers = new JSONArray(store.getPrayersJson());
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            for (int i = 0; i < prayers.length(); i++) {
                String name = prayers.getJSONObject(i).getString("name");
                Intent intent = new Intent(context, PrayerAlarmReceiver.class);
                PendingIntent pi = PendingIntent.getBroadcast(
                    context, name.hashCode(), intent,
                    PendingIntent.FLAG_NO_CREATE | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
                );
                if (pi != null) {
                    alarmManager.cancel(pi);
                    pi.cancel();
                }

                // إلغاء alarm الإقامة
                Intent iqamaIntent = new Intent(context, IqamaAlarmReceiver.class);
                PendingIntent iqamaPi = PendingIntent.getBroadcast(
                    context, name.hashCode() + 5000, iqamaIntent,
                    PendingIntent.FLAG_NO_CREATE | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
                );
                if (iqamaPi != null) {
                    alarmManager.cancel(iqamaPi);
                    iqamaPi.cancel();
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
