package com.islame.app.plugins;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.islame.app.R;
import com.islame.app.overlay.AdhanOverlayManager;
import com.islame.app.storage.PrayerDataStore;

public class IqamaPlayerService extends Service {

    public static final String CHANNEL_ID      = "iqama_player_silent_v2";
    public static final int    NOTIF_ID        = 1002;
    public static final String EXTRA_PRAYER_AR = "prayer_name_ar";

    private MediaPlayer       mediaPlayer;
    private AudioManager      audioManager;
    private AudioFocusRequest audioFocusRequest;
    private String currentPrayerAr;
    private final android.os.Handler heartbeatHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable heartbeatRunnable = new Runnable() {
        @Override
        public void run() {
            ensureNotificationVisible();
            heartbeatHandler.postDelayed(this, 2000);
        }
    };

    // ── الوضع الصامت: تكرار صوت notification كل 30 ثانية لمدة 3 دقائق ──
    private Ringtone silentRingtone;
    private final Handler silentHandler = new Handler(Looper.getMainLooper());
    private final Runnable silentRepeatRunnable = new Runnable() {
        @Override
        public void run() {
            if (silentRingtone != null && !silentRingtone.isPlaying()) {
                try { silentRingtone.play(); } catch (Exception ignored) {}
            }
            silentRepeatCount++;
            if (silentRepeatCount < 6) {
                silentHandler.postDelayed(this, 30_000L);
            } else {
                stopSelf();
            }
        }
    };
    private int silentRepeatCount = 0;

    // ── الوضع القصير: إيقاف الصوت والكارت بعد 30 ثانية ──
    private final Handler shortModeHandler = new Handler(Looper.getMainLooper());
    private final Runnable shortModeStopRunnable = new Runnable() {
        @Override
        public void run() {
            releasePlayer();
            AdhanOverlayManager.hide();
            stopSelf();
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String prayerAr = intent != null ? intent.getStringExtra(EXTRA_PRAYER_AR) : "الصلاة";
        currentPrayerAr = prayerAr;
        startForeground(NOTIF_ID, buildNotification(prayerAr));
        playIqama();

        if (AdhanOverlayManager.canShowOverlay(this)) {
            AdhanOverlayManager.show(this, "إقامة " + prayerAr);
        }

        heartbeatHandler.postDelayed(heartbeatRunnable, 2000);

        return START_NOT_STICKY;
    }

    private void ensureNotificationVisible() {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager == null) return;
            boolean stillActive = false;
            for (android.service.notification.StatusBarNotification sbn : manager.getActiveNotifications()) {
                if (sbn.getId() == NOTIF_ID) {
                    stillActive = true;
                    break;
                }
            }
            if (!stillActive && currentPrayerAr != null) {
                startForeground(NOTIF_ID, buildNotification(currentPrayerAr));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        heartbeatHandler.removeCallbacks(heartbeatRunnable);
        stopSilentRepeat();
        shortModeHandler.removeCallbacks(shortModeStopRunnable);
        AdhanOverlayManager.hide();
        releasePlayer();
        if (audioManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
            } else {
                //noinspection deprecation
                audioManager.abandonAudioFocus(null);
            }
        }
        super.onDestroy();
    }

    @Nullable @Override
    public IBinder onBind(Intent intent) { return null; }

    private void playIqama() {
        PrayerDataStore store = new PrayerDataStore(this);
        String mode = store.getAdhanDurationMode();

        if ("silent".equals(mode)) {
            playSilentRepeat();
            return;
        }
        try {
            releasePlayer();

            int resId = getResources().getIdentifier("iqama", "raw", getPackageName());
            if (resId == 0) { stopSelf(); return; }

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();

            if (audioManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                        .setAudioAttributes(audioAttributes)
                        .setAcceptsDelayedFocusGain(false)
                        .build();
                    audioManager.requestAudioFocus(audioFocusRequest);
                } else {
                    //noinspection deprecation
                    audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
                }
            }

            mediaPlayer = new MediaPlayer();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                mediaPlayer.setAudioAttributes(audioAttributes);
            }
            mediaPlayer.setDataSource(getResources().openRawResourceFd(resId));
            mediaPlayer.prepare();
            mediaPlayer.setOnCompletionListener(mp -> stopSelf());
            mediaPlayer.start();

            if ("short".equals(mode)) {
                shortModeHandler.postDelayed(shortModeStopRunnable, 30_000L);
            }

        } catch (Exception e) {
            e.printStackTrace();
            stopSelf();
        }
    }

    private void playSilentRepeat() {
        try {
            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if (soundUri == null) {
                soundUri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_NOTIFICATION);
            }
            silentRingtone = RingtoneManager.getRingtone(this, soundUri);
            silentRepeatCount = 0;
            if (silentRingtone != null) {
                try { silentRingtone.play(); } catch (Exception ignored) {}
                silentRepeatCount = 1;
                silentHandler.postDelayed(silentRepeatRunnable, 30_000L);
            } else {
                stopSelf();
            }
        } catch (Exception e) {
            e.printStackTrace();
            stopSelf();
        }
    }

    private void stopSilentRepeat() {
        silentHandler.removeCallbacks(silentRepeatRunnable);
        if (silentRingtone != null) {
            try { if (silentRingtone.isPlaying()) silentRingtone.stop(); } catch (Exception ignored) {}
            silentRingtone = null;
        }
    }

    private void releasePlayer() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.release();
            }
        } catch (Exception ignored) {}
        mediaPlayer = null;
    }

    /**
     * إشعار شبحي صامت — مطلوب فقط لتشغيل الخدمة كـ Foreground Service.
     * لا يوجد إشعار منفصل للإقامة في شريط الإشعارات — الواجهة هي الكارت العائم.
     */
    private Notification buildNotification(String prayerAr) {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("🕌 إقامة " + prayerAr)
            .setContentText("")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setOngoing(true)
            .setSilent(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Channel جديد بـ ID مختلف — أندرويد يمنع تغيير importance لـ channel موجود.
            // القناة القديمة "iqama_player_channel" تُترك كما هي (لن تُستخدم بعد الآن).
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "مشغّل الإقامة (صامت)", NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("إشعار صامت لتشغيل خدمة الإقامة في الخلفية");
            channel.setSound(null, null);
            channel.enableVibration(false);
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_SECRET);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }
}
