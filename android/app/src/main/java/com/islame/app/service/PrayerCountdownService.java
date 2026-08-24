package com.islame.app.service;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.widget.RemoteViews;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.islame.app.MainActivity;
import com.islame.app.R;
import com.islame.app.receiver.ServiceRestartReceiver;
import com.islame.app.scheduler.NotificationHelper;
import com.islame.app.storage.PrayerDataStore;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;

/**
 * ForegroundService يعرض countdown حي في شريط الإشعارات.
 *
 * الـ countdown بيتعرض باستخدام Chronometer API المدمج في Android —
 * يعني النظام نفسه بيعدّ الثواني، مش thread بتاعنا.
 * ده بيضمن إن العداد مش بيوقف أبداً حتى لو الشاشة اتقفلت أو التطبيق راح للخلفية.
 *
 * الـ service بيحدّث وقت الصلاة المستهدف كل 30 ثانية فقط (لتغيير عنوان الإشعار لو الصلاة عدّت).
 */
public class PrayerCountdownService extends Service {

    private static final int NOTIF_ID = 42001;
    private static final String CHANNEL_ID = NotificationHelper.COUNTDOWN_CHANNEL_ID;

    private HandlerThread handlerThread;
    private Handler handler;
    private Runnable refreshRunnable;
    private volatile boolean isRunning = false;
    private PowerManager.WakeLock wakeLock;

    // آخر وقت صلاة مستهدف (milliseconds) — لتفادي إعادة بناء الإشعار بدون داعي
    private long lastTargetTimeMs = 0;
    private String lastPrayerName = "";

    // الهدف الحالي للـ countdown + نص الإشعار (يُستخدم لتحديث الـ TextView كل ثانية)
    private volatile long currentTargetTimeMs = 0;
    private volatile String currentTitle = "";
    private volatile String currentBody = "";
    private Runnable tickRunnable;
    private static final long TICK_INTERVAL_MS = 60_000L; // كل دقيقة، مش كل ثانية

    public static final String ACTION_RESTART = "com.islame.app.RESTART_COUNTDOWN";
    private static final long BACKUP_INTERVAL_MS = 65_000L;
    // تحديث عنوان الصلاة كل 30 ثانية (الـ countdown نفسه native مش محتاج تحديث)
    private static final long REFRESH_INTERVAL_MS = 30_000L;

    private static final String[][] PRAYER_MAP = {
        {"Fajr", "الفجر"}, {"Dhuhr", "الظهر"}, {"Asr", "العصر"},
        {"Maghrib", "المغرب"}, {"Isha", "العشاء"}
    };
    private static final String[] PRAYER_ORDER = {"Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"};

    @Override
    public void onCreate() {
        super.onCreate();
        NotificationHelper.createCountdownChannel(this);

        handlerThread = new HandlerThread("PrayerRefreshThread",
                android.os.Process.THREAD_PRIORITY_BACKGROUND);
        handlerThread.start();
        handler = new Handler(handlerThread.getLooper());

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "islame:PrayerCountdownWakeLock"
            );
            wakeLock.setReferenceCounted(false);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (isRunning) {
            // أعد حساب الصلاة المستهدفة فوراً
            if (handler != null) {
                handler.removeCallbacks(refreshRunnable);
                handler.post(refreshRunnable);
            }
            return START_STICKY;
        }

        isRunning = true;

        // notification أولي — هيتغير فوراً لما الـ refresh يشتغل
        Notification notif = buildChronometerNotification(
            "🕌 الصلاة القادمة", "جاري التحميل...",
            System.currentTimeMillis() + 60_000
        );
        startForeground(NOTIF_ID, notif);

        // الـ wakeLock الدائم مش محتاجه بعد ما العداد بقى system-side (Chronometer) —
        // إلغاؤه بيقلل استفزاز Hiber أكتر (E-17)
        scheduleBackupAlarm();

        // Refresh runnable — بيحسب الصلاة التالية ويحدّث الإشعار كل 30 ثانية
        // الـ countdown العددي (الثواني) بيشتغل native من Android نفسه
        refreshRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isRunning) return;
                refreshTargetPrayer();
                handler.postDelayed(this, REFRESH_INTERVAL_MS);
            }
        };
        handler.post(refreshRunnable);

        return START_STICKY;
    }

    /**
     * يحسب الصلاة التالية ويبني إشعار Chronometer countdown
     * الـ OS بيعرض العد التنازلي بنفسه — بدون أي thread
     */
    private void refreshTargetPrayer() {
        try {
            PrayerDataStore store = new PrayerDataStore(this);
            JSONArray prayers = new JSONArray(store.getPrayersJson());
            if (prayers.length() == 0) return;

            long now = System.currentTimeMillis();
            String nextNameAr = null;
            String nextTime = null;
            long targetTimeMs = 0;
            long minDiff = Long.MAX_VALUE;

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
                        nextTime = timeStr;
                        targetTimeMs = cal.getTimeInMillis();
                    }
                }
            }

            if (nextNameAr != null && targetTimeMs > 0) {
                // لو نفس الصلاة — مش محتاج يبني notification جديد (الـ Chronometer شغال)
                if (targetTimeMs == lastTargetTimeMs && nextNameAr.equals(lastPrayerName)) {
                    return;
                }
                lastTargetTimeMs = targetTimeMs;
                lastPrayerName = nextNameAr;

                String title = "🕌 " + nextNameAr + " — " + nextTime;
                String body = "باقي على " + nextNameAr;

                Notification notif = buildChronometerNotification(title, body, targetTimeMs);
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.notify(NOTIF_ID, notif);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String getArabicName(String englishName) {
        for (String[] pair : PRAYER_MAP) {
            if (pair[0].equals(englishName)) return pair[1];
        }
        return englishName;
    }

    /**
     * يبني إشعارًا بتخطيط مخصص — العداد Chronometer بيدور على مستوى النظام
     * (SystemServer surface)، فبيستمر حتى لو الـ process مجمّد.
     */
    private Notification buildChronometerNotification(String title, String body, long targetTimeMs) {
        currentTitle = title;
        currentBody = body;
        currentTargetTimeMs = targetTimeMs;

        RemoteViews views = new RemoteViews(getPackageName(), R.layout.notification_countdown);
        views.setTextViewText(R.id.notif_title, title);
        views.setTextViewText(R.id.countdown_text, formatHm(Math.max(0, targetTimeMs - System.currentTimeMillis())));

        ensureTickScheduled();

        return buildCountdownNotification(views);
    }

    private void ensureTickScheduled() {
        if (handler == null || tickRunnable != null) return;
        tickRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isRunning) return;
                long target = currentTargetTimeMs;
                if (target > 0) {
                    long remaining = target - System.currentTimeMillis();
                    if (remaining < 0) remaining = 0;
                    RemoteViews views = new RemoteViews(getPackageName(), R.layout.notification_countdown);
                    views.setTextViewText(R.id.notif_title, currentTitle);
                    views.setTextViewText(R.id.countdown_text, formatHm(remaining));
                    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                    if (nm != null) {
                        nm.notify(NOTIF_ID, buildCountdownNotification(views));
                    }
                }
                handler.postDelayed(this, TICK_INTERVAL_MS);
            }
        };
        handler.post(tickRunnable);
    }

    private Notification buildCountdownNotification(RemoteViews views) {
        Intent openApp = new Intent(this, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            this, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(currentTitle)
            .setContentText(currentBody)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pi)
            .setCustomContentView(views);

        return builder.build();
    }

    private String formatHms(long ms) {
        long totalSec = ms / 1000;
        long h = totalSec / 3600;
        long m = (totalSec % 3600) / 60;
        long s = totalSec % 60;
        return String.format(Locale.US, "%02d:%02d:%02d", h, m, s);
    }

    private String formatHm(long ms) {
        long totalMin = ms / 60000;
        long h = totalMin / 60;
        long m = totalMin % 60;
        return String.format(Locale.US, "%02d:%02d", h, m);
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        if (handler != null && refreshRunnable != null) {
            handler.removeCallbacks(refreshRunnable);
        }
        if (handler != null && tickRunnable != null) {
            handler.removeCallbacks(tickRunnable);
            tickRunnable = null;
        }
        if (handlerThread != null) {
            handlerThread.quitSafely();
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        cancelBackupAlarm();
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(NOTIF_ID);
        }
        super.onDestroy();
    }

    private void scheduleBackupAlarm() {
        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(this, ServiceRestartReceiver.class);
        i.setAction(ACTION_RESTART);
        PendingIntent pi = PendingIntent.getBroadcast(this, 0, i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.setExactAndAllowWhileIdle(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + BACKUP_INTERVAL_MS,
            pi
        );
    }

    private void cancelBackupAlarm() {
        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(this, ServiceRestartReceiver.class);
        i.setAction(ACTION_RESTART);
        PendingIntent pi = PendingIntent.getBroadcast(this, 0, i,
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null) am.cancel(pi);
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            Intent i = new Intent(this, ServiceRestartReceiver.class);
            i.setAction(ACTION_RESTART);
            PendingIntent pi = PendingIntent.getBroadcast(this, 1, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            am.setExactAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                SystemClock.elapsedRealtime() + 2000L,
                pi
            );
        }
        super.onTaskRemoved(rootIntent);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
