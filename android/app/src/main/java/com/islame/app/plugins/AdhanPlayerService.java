package com.islame.app.plugins;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
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
import android.service.notification.StatusBarNotification;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.islame.app.R;
import com.islame.app.overlay.AdhanOverlayManager;
import com.islame.app.storage.PrayerDataStore;

import java.util.HashMap;
import java.util.Map;

public class AdhanPlayerService extends Service {

    private static final Map<String, Integer> SHORT_CUT_MS = new HashMap<>();
    static {
        SHORT_CUT_MS.put("adhan_abdulbasit", 39000);
        SHORT_CUT_MS.put("adhan_europe", 37000);
        SHORT_CUT_MS.put("adhan_husary", 24000);
        SHORT_CUT_MS.put("adhan_madinah", 37000);
        SHORT_CUT_MS.put("adhan_makkah", 27000);
    }

    public static final String CHANNEL_ID = "adhan_player_silent_v2";
    public static final int NOTIF_ID = 1001;
    public static final String ACTION_STOP = "com.islame.app.STOP_ADHAN";
    public static final String EXTRA_MUEZZIN = "muezzin";
    public static final String EXTRA_PRAYER = "prayer_name";
    public static final String EXTRA_PRAYER_AR = "prayer_name_ar";

    private MediaPlayer mediaPlayer;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private String currentPrayerAr;

    private final Handler heartbeatHandler = new Handler(Looper.getMainLooper());
    private final Runnable heartbeatRunnable = new Runnable() {
        @Override
        public void run() {
            ensureNotificationVisible();
            heartbeatHandler.postDelayed(this, 2000);
        }
    };

    private Ringtone silentRingtone;
    private final Handler silentHandler = new Handler(Looper.getMainLooper());
    private final Runnable silentRepeatRunnable = new Runnable() {
        @Override
        public void run() {
            if (silentRingtone != null && !silentRingtone.isPlaying()) {
                try {
                    silentRingtone.play();
                } catch (Exception ignored) {
                }
            }
            silentRepeatCount++;
            if (silentRepeatCount < 6) {
                silentHandler.postDelayed(this, 30000);
            } else {
                stopSelf();
            }
        }
    };
    private int silentRepeatCount = 0;

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
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String muezzin = intent != null ? intent.getStringExtra(EXTRA_MUEZZIN) : "adhan_makkah";
        String prayerName = intent != null ? intent.getStringExtra(EXTRA_PRAYER) : "Prayer";
        String prayerAr = intent != null ? intent.getStringExtra(EXTRA_PRAYER_AR) : "الصلاة";
        currentPrayerAr = prayerAr;
        if (Build.VERSION.SDK_INT >= 26) {
            startForeground(NOTIF_ID, buildNotification(prayerAr));
        } else {
            startForeground(NOTIF_ID, buildNotification(prayerAr));
        }
        playAdhan(muezzin);
        Log.d("AdhanOverlay", "AdhanPlayerService reached overlay check");
        if (AdhanOverlayManager.canShowOverlay(this)) {
            AdhanOverlayManager.show(this, prayerAr);
        }
        heartbeatHandler.postDelayed(heartbeatRunnable, 2000);
        return START_NOT_STICKY;
    }

    private void ensureNotificationVisible() {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) {
                return;
            }
            boolean found = false;
            StatusBarNotification[] active = manager.getActiveNotifications();
            int len = active.length;
            for (int i = 0; i < len; i++) {
                StatusBarNotification n = active[i];
                if (n.getId() == NOTIF_ID) {
                    found = true;
                    break;
                }
            }
            if (!found && currentPrayerAr != null) {
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
            if (Build.VERSION.SDK_INT >= 26) {
                if (audioFocusRequest != null) {
                    audioManager.abandonAudioFocusRequest(audioFocusRequest);
                }
            } else {
                audioManager.abandonAudioFocus(null);
            }
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void playAdhan(String muezzin) {
        PrayerDataStore dataStore = new PrayerDataStore(this);
        String durationMode = dataStore.getAdhanDurationMode();
        if ("silent".equals(durationMode)) {
            playSilentRepeat();
            return;
        }
        if (muezzin == null || muezzin.isEmpty()) {
            muezzin = "adhan_makkah";
        } else if (!muezzin.startsWith("adhan_")) {
            muezzin = "adhan_" + muezzin;
        }
        releasePlayer();
        int resId = getResources().getIdentifier(muezzin, "raw", getPackageName());
        if (resId == 0) {
            stopSelf();
            return;
        }
        try {
            mediaPlayer = new MediaPlayer();
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            if (Build.VERSION.SDK_INT >= 21) {
                mediaPlayer.setAudioAttributes(audioAttributes);
            }
            if (audioManager != null) {
                if (Build.VERSION.SDK_INT >= 26) {
                    audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                            .setAudioAttributes(audioAttributes)
                            .setAcceptsDelayedFocusGain(false)
                            .build();
                    audioManager.requestAudioFocus(audioFocusRequest);
                } else {
                    audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
                }
            }
            mediaPlayer.setDataSource(getResources().openRawResourceFd(resId));
            mediaPlayer.prepare();
            mediaPlayer.setOnCompletionListener(mp -> stopSelf());
            mediaPlayer.start();
            if ("short".equals(durationMode)) {
                int cutMs = SHORT_CUT_MS.containsKey(muezzin) ? SHORT_CUT_MS.get(muezzin) : 38000;
                shortModeHandler.postDelayed(shortModeStopRunnable, cutMs);
            }
        } catch (Exception e) {
            e.printStackTrace();
            stopSelf();
        }
    }

    private void playSilentRepeat() {
        Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        if (uri == null) {
            uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_NOTIFICATION);
        }
        try {
            silentRingtone = RingtoneManager.getRingtone(this, uri);
            silentRepeatCount = 0;
            if (silentRingtone != null) {
                try {
                    silentRingtone.play();
                } catch (Exception ignored) {
                }
                silentRepeatCount = 1;
                silentHandler.postDelayed(silentRepeatRunnable, 30000);
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
            try {
                if (silentRingtone.isPlaying()) {
                    silentRingtone.stop();
                }
            } catch (Exception ignored) {
            }
            silentRingtone = null;
        }
    }

    private void releasePlayer() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception ignored) {
            }
            mediaPlayer = null;
        }
    }

    private Notification buildNotification(String prayerAr) {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("🕌 " + prayerAr)
                .setContentText("")
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setOngoing(true)
                .setSilent(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setVisibility(NotificationCompat.VISIBILITY_SECRET)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "مشغّل الأذان (صامت)", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("إشعار صامت للتشغيل في الخلفية — في الواجهة في الكارت العام");
            channel.setSound(null, null);
            channel.enableVibration(false);
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_SECRET);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}