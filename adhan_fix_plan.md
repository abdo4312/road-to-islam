# 🕌 Adhan Background Service — Implementation Plan

## Problem Statement

The Adhan (Islamic prayer call) only works when the app is **open/foreground**. When the user kills the app (swipe away), the Adhan stops because all scheduling logic runs inside the **WebView** (JavaScript `setInterval` + `HTMLAudioElement`).

**Root Cause**: No Android native code exists. Everything relies on the WebView which dies when the app is killed.

## Current Architecture (BROKEN)

```
┌─ WebView (React/TypeScript) ────────────────────────┐
│  adhanPlayer.ts    → setInterval(1s) + HTMLAudio    │  ← Dies when app killed
│  adhanService.ts   → LocalNotifications (silent)    │  ← Notifications come but no audio
│  PrayerAlarm.ts    → registerPlugin (no native!)    │  ← No Java/Kotlin implementation
│  AdhanOverlay.tsx  → Full-screen overlay            │  ← Only visible when app is open
└─────────────────────────────────────────────────────┘
                    ⬇ App killed ⬇
┌─ Android Native Layer ──────────────────────────────┐
│  EMPTY — No Java/Kotlin code                        │
│  No AlarmManager, No BroadcastReceiver              │
│  No MediaPlayer service, No Boot receiver           │
└─────────────────────────────────────────────────────┘
```

## Target Architecture (FIXED)

```
┌─ WebView (React/TypeScript) ────────────────────────┐
│  adhanPlayer.ts    → In-app audio (when open)       │  ← Still works when open
│  adhanService.ts   → Calls PrayerAlarm plugin       │  ← Sends data to native
│  PrayerAlarm.ts    → registerPlugin → Native Java   │  ← Bridge to native
└─────────────────────────────────────────────────────┘
                    ⬇ Sends prayer times via plugin ⬇
┌─ Android Native Layer (NEW) ────────────────────────┐
│  PrayerAlarmPlugin.java → Capacitor Plugin          │
│  AdhanAlarmReceiver.java → BroadcastReceiver        │
│  AdhanPlaybackService.java → Foreground Service     │
│  BootReceiver.java → Re-schedule after reboot       │
│  AlarmManager.setExactAndAllowWhileIdle()           │
│  MediaPlayer → Plays full adhan audio               │
└─────────────────────────────────────────────────────┘
```

---

## Files to Create

### File 1: `android/app/src/main/java/com/islame/app/PrayerAlarmPlugin.java`

**Purpose**: Capacitor plugin that receives prayer times from JavaScript and schedules Android AlarmManager alarms.

```java
package com.islame.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

@CapacitorPlugin(name = "PrayerAlarm")
public class PrayerAlarmPlugin extends Plugin {
    private static final String TAG = "PrayerAlarm";
    private static final String PREFS_NAME = "prayer_alarm_prefs";

    @PluginMethod
    public void schedulePrayers(PluginCall call) {
        try {
            JSArray prayers = call.getArray("prayers");
            String muezzin = call.getString("muezzin", "makkah");
            int iqamaDelay = call.getInt("iqamaDelay", 10);
            JSArray mutedPrayers = call.getArray("mutedPrayers");
            boolean notificationsEnabled = call.getBoolean("notificationsEnabled", true);

            if (!notificationsEnabled) {
                cancelAllAlarms();
                call.resolve(new JSObject().put("success", true));
                return;
            }

            // Save to SharedPreferences for BootReceiver
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString("prayers", prayers.toString());
            editor.putString("muezzin", muezzin);
            editor.putInt("iqamaDelay", iqamaDelay);
            editor.putString("mutedPrayers", mutedPrayers != null ? mutedPrayers.toString() : "[]");
            editor.putBoolean("notificationsEnabled", notificationsEnabled);
            editor.apply();

            // Cancel existing alarms
            cancelAllAlarms();

            // Schedule each prayer
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) {
                call.reject("AlarmManager not available");
                return;
            }

            // Build muted set
            java.util.Set<String> mutedSet = new java.util.HashSet<>();
            if (mutedPrayers != null) {
                for (int i = 0; i < mutedPrayers.length(); i++) {
                    mutedSet.add(mutedPrayers.getString(i));
                }
            }

            Calendar now = Calendar.getInstance();
            int alarmId = 2000; // Start from 2000 to avoid collision with LocalNotifications

            for (int i = 0; i < prayers.length(); i++) {
                JSONObject prayer = prayers.getJSONObject(i);
                String name = prayer.getString("name");
                String time = prayer.getString("time");

                // Skip Sunrise and muted prayers
                if ("Sunrise".equals(name) || mutedSet.contains(name)) continue;

                // Parse time "HH:mm"
                String[] parts = time.split(":");
                int hour = Integer.parseInt(parts[0]);
                int minute = Integer.parseInt(parts[1]);

                Calendar prayerTime = Calendar.getInstance();
                prayerTime.set(Calendar.HOUR_OF_DAY, hour);
                prayerTime.set(Calendar.MINUTE, minute);
                prayerTime.set(Calendar.SECOND, 0);
                prayerTime.set(Calendar.MILLISECOND, 0);

                // Skip if time has passed
                if (prayerTime.before(now)) continue;

                // Create intent for AdhanAlarmReceiver
                Intent intent = new Intent(getContext(), AdhanAlarmReceiver.class);
                intent.putExtra("prayer_name", name);
                intent.putExtra("muezzin", muezzin);
                intent.putExtra("prayer_time", time);
                intent.setAction("com.islame.app.ADHAN_ALARM_" + name);

                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    getContext(), alarmId++, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                // Schedule exact alarm that works in Doze mode
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        prayerTime.getTimeInMillis(),
                        pendingIntent
                    );
                } else {
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        prayerTime.getTimeInMillis(),
                        pendingIntent
                    );
                }

                Log.d(TAG, "Scheduled alarm for " + name + " at " + time);
            }

            call.resolve(new JSObject().put("success", true));
        } catch (Exception e) {
            Log.e(TAG, "Error scheduling prayers", e);
            call.reject("Error scheduling prayers: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setNotificationsEnabled(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean("notificationsEnabled", enabled).apply();

        if (!enabled) {
            cancelAllAlarms();
        }
        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void startCountdown(PluginCall call) {
        // Countdown is handled by WebView when app is open
        // Native countdown notification is optional — implement if needed
        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void stopCountdown(PluginCall call) {
        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void updateSettings(PluginCall call) {
        call.resolve(new JSObject().put("success", true));
    }

    private void cancelAllAlarms() {
        AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        String[] prayers = {"Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"};
        int alarmId = 2000;
        for (String name : prayers) {
            Intent intent = new Intent(getContext(), AdhanAlarmReceiver.class);
            intent.setAction("com.islame.app.ADHAN_ALARM_" + name);
            PendingIntent pi = PendingIntent.getBroadcast(
                getContext(), alarmId++, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(pi);
        }
    }
}
```

---

### File 2: `android/app/src/main/java/com/islame/app/AdhanAlarmReceiver.java`

**Purpose**: BroadcastReceiver that fires when AlarmManager triggers at prayer time. Starts AdhanPlaybackService.

```java
package com.islame.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class AdhanAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AdhanAlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String prayerName = intent.getStringExtra("prayer_name");
        String muezzin = intent.getStringExtra("muezzin");
        String prayerTime = intent.getStringExtra("prayer_time");

        Log.d(TAG, "Adhan alarm triggered for: " + prayerName + " at " + prayerTime);

        // Start the playback service
        Intent serviceIntent = new Intent(context, AdhanPlaybackService.class);
        serviceIntent.putExtra("prayer_name", prayerName);
        serviceIntent.putExtra("muezzin", muezzin);
        serviceIntent.putExtra("prayer_time", prayerTime);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
```

---

### File 3: `android/app/src/main/java/com/islame/app/AdhanPlaybackService.java`

**Purpose**: Foreground Service that plays the adhan audio using MediaPlayer. Works even when app is killed.

```java
package com.islame.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.HashMap;
import java.util.Map;

public class AdhanPlaybackService extends Service {
    private static final String TAG = "AdhanPlayback";
    private static final String CHANNEL_ID = "adhan_playback";
    private static final int NOTIFICATION_ID = 3000;

    private MediaPlayer mediaPlayer;

    // Map muezzin ID to raw resource name
    private static final Map<String, String> MUEZZIN_FILES = new HashMap<String, String>() {{
        put("husary", "adhan_husary");
        put("abdulbasit", "adhan_abdulbasit");
        put("makkah", "adhan_makkah");
        put("madinah", "adhan_madinah");
        put("europe", "adhan_europe");
    }};

    // Arabic prayer names
    private static final Map<String, String> PRAYER_NAMES_AR = new HashMap<String, String>() {{
        put("Fajr", "الفجر");
        put("Dhuhr", "الظهر");
        put("Asr", "العصر");
        put("Maghrib", "المغرب");
        put("Isha", "العشاء");
    }};

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String prayerName = intent.getStringExtra("prayer_name");
        String muezzin = intent.getStringExtra("muezzin");
        String prayerTime = intent.getStringExtra("prayer_time");

        String nameAr = PRAYER_NAMES_AR.getOrDefault(prayerName, prayerName);

        // Show foreground notification
        Notification notification = buildNotification(nameAr, prayerTime);
        startForeground(NOTIFICATION_ID, notification);

        // Play adhan audio
        playAdhan(muezzin);

        return START_NOT_STICKY;
    }

    private void playAdhan(String muezzin) {
        try {
            // Stop any existing playback
            if (mediaPlayer != null) {
                mediaPlayer.release();
                mediaPlayer = null;
            }

            String fileName = MUEZZIN_FILES.getOrDefault(muezzin, "adhan_makkah");

            // Try to load from res/raw
            int resId = getResources().getIdentifier(fileName, "raw", getPackageName());

            if (resId != 0) {
                mediaPlayer = MediaPlayer.create(this, resId);
            } else {
                // Fallback: try loading from assets
                mediaPlayer = new MediaPlayer();
                AssetFileDescriptor afd = getAssets().openFd("public/audio/" + fileName + ".mp3");
                mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                afd.close();
                mediaPlayer.prepare();
            }

            if (mediaPlayer != null) {
                mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build());

                mediaPlayer.setOnCompletionListener(mp -> {
                    Log.d(TAG, "Adhan playback complete");
                    mp.release();
                    mediaPlayer = null;
                    stopForeground(true);
                    stopSelf();
                });

                mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                    Log.e(TAG, "MediaPlayer error: " + what + ", " + extra);
                    mp.release();
                    mediaPlayer = null;
                    stopForeground(true);
                    stopSelf();
                    return true;
                });

                mediaPlayer.start();
                Log.d(TAG, "Playing adhan: " + fileName);
            } else {
                Log.e(TAG, "Could not create MediaPlayer for: " + fileName);
                stopForeground(true);
                stopSelf();
            }

        } catch (Exception e) {
            Log.e(TAG, "Error playing adhan", e);
            stopForeground(true);
            stopSelf();
        }
    }

    private Notification buildNotification(String prayerNameAr, String prayerTime) {
        // Intent to open the app when notification is tapped
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🕌 حان وقت " + prayerNameAr)
            .setContentText("الأذان يُرفع الآن")
            .setSmallIcon(getApplicationInfo().icon) // Use app icon; replace with ic_notification if available
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(pendingIntent)
            .setOngoing(true) // Keep during playback
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "أذان الصلاة",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("إشعارات الأذان");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            // Do NOT set sound on channel — MediaPlayer handles audio
            channel.setSound(null, null);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        if (mediaPlayer != null) {
            mediaPlayer.release();
            mediaPlayer = null;
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
```

---

### File 4: `android/app/src/main/java/com/islame/app/BootReceiver.java`

**Purpose**: Re-schedules all adhan alarms after device reboot.

```java
package com.islame.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    private static final String PREFS_NAME = "prayer_alarm_prefs";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action) &&
            !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) return;

        Log.d(TAG, "Boot/update received — re-scheduling adhan alarms");

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean("notificationsEnabled", true);
        if (!enabled) return;

        String prayersJson = prefs.getString("prayers", "[]");
        String muezzin = prefs.getString("muezzin", "makkah");
        String mutedJson = prefs.getString("mutedPrayers", "[]");

        try {
            JSONArray prayers = new JSONArray(prayersJson);
            JSONArray mutedArr = new JSONArray(mutedJson);

            Set<String> mutedSet = new HashSet<>();
            for (int i = 0; i < mutedArr.length(); i++) {
                mutedSet.add(mutedArr.getString(i));
            }

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Calendar now = Calendar.getInstance();
            int alarmId = 2000;

            for (int i = 0; i < prayers.length(); i++) {
                JSONObject prayer = prayers.getJSONObject(i);
                String name = prayer.getString("name");
                String time = prayer.getString("time");

                if ("Sunrise".equals(name) || mutedSet.contains(name)) continue;

                String[] parts = time.split(":");
                int hour = Integer.parseInt(parts[0]);
                int minute = Integer.parseInt(parts[1]);

                Calendar prayerTime = Calendar.getInstance();
                prayerTime.set(Calendar.HOUR_OF_DAY, hour);
                prayerTime.set(Calendar.MINUTE, minute);
                prayerTime.set(Calendar.SECOND, 0);
                prayerTime.set(Calendar.MILLISECOND, 0);

                if (prayerTime.before(now)) continue;

                Intent alarmIntent = new Intent(context, AdhanAlarmReceiver.class);
                alarmIntent.putExtra("prayer_name", name);
                alarmIntent.putExtra("muezzin", muezzin);
                alarmIntent.putExtra("prayer_time", time);
                alarmIntent.setAction("com.islame.app.ADHAN_ALARM_" + name);

                PendingIntent pi = PendingIntent.getBroadcast(
                    context, alarmId++, alarmIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        prayerTime.getTimeInMillis(), pi
                    );
                } else {
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        prayerTime.getTimeInMillis(), pi
                    );
                }

                Log.d(TAG, "Re-scheduled: " + name + " at " + time);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error re-scheduling alarms", e);
        }
    }
}
```

---

## AndroidManifest.xml Changes

Add inside `<manifest>` tag (before `<application>`):

```xml
<!-- Exact alarm permission (Android 12+) -->
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<!-- Android 14+ may need this instead -->
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<!-- Wake lock for alarm processing -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<!-- Re-schedule after reboot -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<!-- Foreground service for audio playback -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
```

Add inside `<application>` tag:

```xml
<!-- Adhan Alarm Receiver -->
<receiver
    android:name=".AdhanAlarmReceiver"
    android:enabled="true"
    android:exported="false" />

<!-- Adhan Playback Service -->
<service
    android:name=".AdhanPlaybackService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="mediaPlayback" />

<!-- Boot Receiver — re-schedule alarms after reboot -->
<receiver
    android:name=".BootReceiver"
    android:enabled="true"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
    </intent-filter>
</receiver>
```

---

## Plugin Registration

### In `android/app/src/main/java/com/islame/app/MainActivity.java`:

Make sure the plugin is registered. In Capacitor 5+, auto-registration should work, but if not, add:

```java
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // PrayerAlarmPlugin will be auto-registered via @CapacitorPlugin annotation
    // If not working, override onCreate and add:
    // this.registerPlugin(PrayerAlarmPlugin.class);
}
```

---

## Audio Files Setup

Copy the adhan MP3 files to Android raw resources:

```
android/app/src/main/res/raw/adhan_husary.mp3
android/app/src/main/res/raw/adhan_abdulbasit.mp3
android/app/src/main/res/raw/adhan_makkah.mp3
android/app/src/main/res/raw/adhan_madinah.mp3
android/app/src/main/res/raw/adhan_europe.mp3
```

Note: File names must be lowercase, no hyphens. The files are currently in `public/audio/`.

---

## TypeScript Changes (Minor)

### In `src/plugins/PrayerAlarm.ts` — No changes needed
The existing TypeScript interface already matches the Java plugin methods.

### In `src/lib/adhanService.ts` — `syncPrayersToNative()` already calls the plugin correctly
The existing `syncPrayersToNative()` function calls `PrayerAlarm.schedulePrayers()` which will now hit the Java implementation.

---

## Build & Test Steps

1. Copy the 4 Java files to `android/app/src/main/java/com/islame/app/`
2. Copy MP3 files to `android/app/src/main/res/raw/`
3. Update `AndroidManifest.xml` with permissions and component declarations
4. Run `npm run build && npx cap sync android`
5. Open in Android Studio: `npx cap open android`
6. Build and test:
   - Open app → verify adhan works when app is open (existing behavior)
   - Kill app (swipe away) → wait for next prayer → adhan should play!
   - Restart device → alarms should re-schedule via BootReceiver

## Testing Tips

- To test quickly, temporarily change a prayer time to 2 minutes from now in the prayer cache
- Check Android logs: `adb logcat -s PrayerAlarm AdhanAlarmReceiver AdhanPlayback BootReceiver`
- If exact alarms don't fire on Android 12+, user may need to grant "Alarms & reminders" permission in Settings → Apps → Islame → Permissions

## Important Notes

- The `adhanPlayer.ts` (in-app audio) should remain for when the app is open — it provides better UX with the overlay
- The native AlarmManager solution runs independently and will play audio even when app is killed
- Both systems coexist: native handles background, WebView handles foreground
- On Android 13+, the POST_NOTIFICATIONS permission is needed — Capacitor's LocalNotifications already handles this
