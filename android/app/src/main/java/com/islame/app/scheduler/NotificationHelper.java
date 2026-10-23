package com.islame.app.scheduler;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.app.PendingIntent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.islame.app.R;

public class NotificationHelper {
    public static final String COUNTDOWN_CHANNEL_ID = "prayer_countdown_channel_v2";
    public static final String ALARM_CHANNEL_PREFIX = "adhan_channel_"; // followed by muezzinId
    public static final int COUNTDOWN_NOTIF_ID = 42001;

    public static void createCountdownChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                COUNTDOWN_CHANNEL_ID,
                "مواقيت الصلاة",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("إشعار دائم يوضح الوقت المتبقي للصلاة القادمة");
            channel.setShowBadge(false);
            
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    public static void updateCountdownNotification(Context context, String title, String content) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        Intent openApp = new Intent(context, com.islame.app.MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(context, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(context, COUNTDOWN_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(content)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pi)
            .build();

        manager.notify(COUNTDOWN_NOTIF_ID, notification);
    }

    public static void cancelCountdownNotification(Context context) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(COUNTDOWN_NOTIF_ID);
        }
    }
}
