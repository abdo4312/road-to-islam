package com.islame.app.worker;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.*;
import com.islame.app.scheduler.NotificationHelper;
import com.islame.app.scheduler.PrayerScheduler;
import com.islame.app.storage.PrayerDataStore;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.concurrent.TimeUnit;

public class PrayerCountdownWorker extends Worker {
    private static final String[] PRAYER_ORDER = {"Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"};
    private static final String[][] PRAYER_MAP = {
        {"Fajr", "الفجر"}, {"Dhuhr", "الظهر"}, {"Asr", "العصر"},
        {"Maghrib", "المغرب"}, {"Isha", "العشاء"}
    };

    private String getArabicName(String englishName) {
        for (String[] pair : PRAYER_MAP) {
            if (pair[0].equals(englishName)) return pair[1];
        }
        return englishName;
    }

    public PrayerCountdownWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        PrayerDataStore store = new PrayerDataStore(context);
        
        if (!store.isNotificationsEnabled()) {
            NotificationHelper.cancelCountdownNotification(context);
            return Result.success();
        }

        try {
            JSONArray prayers = new JSONArray(store.getPrayersJson());
            if (prayers.length() == 0) return Result.success();

            long now = System.currentTimeMillis();
            long minDiff = Long.MAX_VALUE;
            String nextNameAr = null;

            for (String prayerName : PRAYER_ORDER) {
                for (int i = 0; i < prayers.length(); i++) {
                    JSONObject p = prayers.getJSONObject(i);
                    if (!p.getString("name").equals(prayerName)) continue;

                    String timeStr = p.getString("time");
                    String[] parts = timeStr.split(":");
                    
                    Calendar cal = Calendar.getInstance();
                    cal.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0]));
                    cal.set(Calendar.MINUTE, Integer.parseInt(parts[1]));
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);

                    if (cal.getTimeInMillis() <= now) {
                        cal.add(Calendar.DAY_OF_YEAR, 1);
                    }

                    long diff = cal.getTimeInMillis() - now;
                    if (diff < minDiff) {
                        minDiff = diff;
                        nextNameAr = getArabicName(prayerName);
                    }
                }
            }

            if (nextNameAr != null) {
                long h = minDiff / (1000 * 60 * 60);
                long m = (minDiff / (1000 * 60)) % 60;
                String content = String.format("متبقي %d ساعة و %d دقيقة على صلاة %s", h, m, nextNameAr);
                NotificationHelper.updateCountdownNotification(context, "الصلاة القادمة", content);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return Result.success();
    }

    public static void start(Context context) {
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(
            PrayerCountdownWorker.class, 15, TimeUnit.MINUTES
        ).build();

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "prayer_countdown",
            ExistingPeriodicWorkPolicy.UPDATE,
            request
        );
    }
}
