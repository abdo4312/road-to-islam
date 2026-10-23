package com.islame.app.worker;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.*;
import com.islame.app.scheduler.PrayerScheduler;
import com.islame.app.storage.PrayerDataStore;

import java.util.concurrent.TimeUnit;

/**
 * شبكة أمان: بتتأكد كل ساعة إن الـ Alarms بتاعة الأذان لسه مجدولة صح،
 * بغض النظر عن إعادة تشغيل الجهاز أو إن آخر أذان دق فعليًا ولا لأ.
 * لازم لأنظمة زي XOS/MIUI اللي بتمسح AlarmManager alarms بعدوانية
 * في الخلفية من غير ما تدي التطبيق فرصة يعيد الجدولة بنفسه.
 */
public class PrayerRescheduleWorker extends Worker {

    public PrayerRescheduleWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        PrayerDataStore store = new PrayerDataStore(context);

        if (!store.isNotificationsEnabled()) {
            return Result.success();
        }

        try {
            PrayerScheduler.scheduleNextAlarms(context);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.retry();
        }

        return Result.success();
    }

    public static void start(Context context) {
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(
            PrayerRescheduleWorker.class, 1, TimeUnit.HOURS
        ).build();

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "prayer_reschedule_safety_net",
            ExistingPeriodicWorkPolicy.UPDATE,
            request
        );
    }
}
