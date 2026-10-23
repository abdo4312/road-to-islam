package com.islame.app.plugins;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.islame.app.overlay.AdhanOverlayManager;
import com.islame.app.scheduler.NotificationHelper;
import com.islame.app.scheduler.PrayerScheduler;
import com.islame.app.storage.PrayerDataStore;
import com.islame.app.worker.PrayerCountdownWorker;
import com.islame.app.service.PrayerCountdownService;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.net.Uri;
import android.os.PowerManager;
import android.provider.Settings;

import java.util.Calendar;

@CapacitorPlugin(name = "PrayerAlarm")
public class PrayerAlarmPlugin extends Plugin {

    private BroadcastReceiver adhanStartedReceiver;

    @Override
    public void load() {
        // ── Native→JS bridge: تحويل بث بدء الأذان إلى حدث adhanStarted للـ JS ──
        adhanStartedReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                JSObject ret = new JSObject();
                ret.put("prayerName", intent.getStringExtra(AdhanPlayerService.EXTRA_PRAYER));
                ret.put("prayerNameAr", intent.getStringExtra(AdhanPlayerService.EXTRA_PRAYER_AR));
                notifyListeners("adhanStarted", ret);
            }
        };
        IntentFilter filter = new IntentFilter(AdhanPlayerService.ACTION_ADHAN_STARTED);
        getContext().registerReceiver(adhanStartedReceiver, filter);
    }

    @Override
    protected void handleOnDestroy() {
        if (adhanStartedReceiver != null) {
            try {
                getContext().unregisterReceiver(adhanStartedReceiver);
            } catch (Exception ignored) {
                // receiver might already be unregistered
            }
            adhanStartedReceiver = null;
        }
    }

    /**
     * حالة الخدمة الأصلية الحالية — تُستخدم عند استئناف التطبيق لتغطية
     * سباق بث ADHAN_STARTED قبل جاهزية مستمع الـ JS.
     */
    @PluginMethod
    public void isAdhanPlaying(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("playing", AdhanPlayerService.isPlaying);
        String nameAr = AdhanPlayerService.currentPrayerNameAr;
        if (nameAr != null && !nameAr.isEmpty()) {
            ret.put("prayerNameAr", nameAr);
        }
        call.resolve(ret);
    }

    /**
     * يُستدعى عند انتقال التطبيق للخلفية أثناء الأذان — يُظهر الكارت النيوني
     * Native إذا كان الصوت لا يزال يعمل. يغطي حالة ترك التطبيق أثناء التشغيل
     * حيث لم يُعرض الـ overlay لأن التطبيق كان foreground عند البدء.
     */
    @PluginMethod
    public void showAdhanOverlayIfPlaying(PluginCall call) {
        try {
            if (AdhanPlayerService.isPlaying) {
                String prayerNameAr = AdhanPlayerService.currentPrayerNameAr;
                if (prayerNameAr == null || prayerNameAr.isEmpty()) {
                    prayerNameAr = "الصلاة";
                }
                Context ctx = getContext();
                if (AdhanOverlayManager.canShowOverlay(ctx)) {
                    AdhanOverlayManager.show(ctx, prayerNameAr);
                }
            }
            call.resolve(new JSObject().put("success", true));
        } catch (Exception e) {
            call.reject("showAdhanOverlayIfPlaying failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void schedulePrayers(PluginCall call) {
        String prayers = call.getArray("prayers").toString();
        String muezzin = call.getString("muezzin");
        int iqama = call.getInt("iqamaDelay", 10);
        String muted = call.getArray("mutedPrayers").toString();
        boolean enabled = call.getBoolean("notificationsEnabled", true);
        String adhanDurationMode = call.getString("adhanDurationMode", "full");

        PrayerDataStore store = new PrayerDataStore(getContext());
        
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        
        store.savePrayers(prayers, String.valueOf(cal.getTimeInMillis()));
        store.saveMuezzin(muezzin);
        store.saveIqamaDelay(iqama);
        store.saveMutedPrayers(muted);
        store.setNotificationsEnabled(enabled);
        store.setAdhanDurationMode(adhanDurationMode);

        NotificationHelper.createCountdownChannel(getContext());
        PrayerScheduler.scheduleNextAlarms(getContext());
        PrayerCountdownWorker.start(getContext());

        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void setNotificationsEnabled(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        PrayerDataStore store = new PrayerDataStore(getContext());
        store.setNotificationsEnabled(enabled);

        if (enabled) {
            PrayerScheduler.scheduleNextAlarms(getContext());
            PrayerCountdownWorker.start(getContext());
        } else {
            PrayerScheduler.cancelAllAlarms(getContext());
            NotificationHelper.cancelCountdownNotification(getContext());
        }
        call.resolve();
    }

    @PluginMethod
    public void updateSettings(PluginCall call) {
        PrayerDataStore store = new PrayerDataStore(getContext());

        // ✅ FIX: احفظ المؤذن مباشرة هنا، بغض النظر عن وجود كاش أوقات الصلاة —
        // كان الحفظ الوحيد بيحصل جوه schedulePrayers()، اللي بترجع بصمت لو
        // getPrayerTimingsFromCache() فاضية، فيفضل المؤذن القديم عالق native-side
        String muezzin = call.getString("muezzin", null);
        if (muezzin != null) {
            store.saveMuezzin(muezzin);
        }

        // اقرأ adhanDurationMode من الـ call لو موجود (للتحديث الفوري بدون إعادة جدولة كاملة)
        String adhanDurationMode = call.getString("adhanDurationMode", null);
        if (adhanDurationMode != null) {
            store.setAdhanDurationMode(adhanDurationMode);
        }

        // ── نقطة الدخول الموحّدة: باقي الحقول الاختيارية (نفس نمط muezzin أعلاه) ──
        Integer iqamaDelay = call.getInt("iqamaDelay");
        if (iqamaDelay != null && iqamaDelay > 0) {
            store.saveIqamaDelay(iqamaDelay);
        }

        JSArray mutedPrayers = call.getArray("mutedPrayers");
        if (mutedPrayers != null) {
            store.saveMutedPrayers(mutedPrayers.toString());
        }

        Boolean notificationsEnabled = call.getBoolean("notificationsEnabled");
        if (notificationsEnabled != null) {
            store.setNotificationsEnabled(notificationsEnabled);
        }

        PrayerScheduler.scheduleNextAlarms(getContext());
        // أعد تشغيل الـ countdown service عشان يقرأ البيانات الجديدة
        Intent serviceIntent = new Intent(getContext(), PrayerCountdownService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        call.resolve(new JSObject().put("success", true));
    }

    /**
     * يبدأ الـ countdown الحي (ForegroundService مع timer كل ثانية)
     * JS call: PrayerAlarm.startCountdown()
     */
    @PluginMethod
    public void startCountdown(PluginCall call) {
        Context ctx = getContext();
        NotificationHelper.createCountdownChannel(ctx);

        Intent serviceIntent = new Intent(ctx, PrayerCountdownService.class);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(serviceIntent);
        } else {
            ctx.startService(serviceIntent);
        }

        call.resolve(new JSObject().put("success", true));
    }

    /**
     * يوقف الـ countdown الحي
     * JS call: PrayerAlarm.stopCountdown()
     */
    @PluginMethod
    public void stopCountdown(PluginCall call) {
        Context ctx = getContext();
        ctx.stopService(new Intent(ctx, PrayerCountdownService.class));
        NotificationHelper.cancelCountdownNotification(ctx);
        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void playAdhan(PluginCall call) {
        String muezzin    = call.getString("muezzin", "adhan_makkah");
        String prayerName = call.getString("prayerName", "Prayer");
        String prayerAr   = call.getString("prayerNameAr", "الصلاة");

        try {
            Context ctx = getContext();
            Intent intent = new Intent(ctx, AdhanPlayerService.class);
            intent.putExtra(AdhanPlayerService.EXTRA_MUEZZIN,    muezzin);
            intent.putExtra(AdhanPlayerService.EXTRA_PRAYER,     prayerName);
            intent.putExtra(AdhanPlayerService.EXTRA_PRAYER_AR,  prayerAr);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(intent);
            } else {
                ctx.startService(intent);
            }
            call.resolve(new JSObject().put("success", true));
        } catch (Exception e) {
            call.reject("playAdhan failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopAdhan(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent = new Intent(ctx, AdhanPlayerService.class);
            ctx.stopService(intent);
            call.resolve(new JSObject().put("success", true));
        } catch (Exception e) {
            call.reject("stopAdhan failed: " + e.getMessage());
        }
    }
    @PluginMethod
    public void requestBatteryOptimizationExemption(PluginCall call) {
        try {
            PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            String packageName = getContext().getPackageName();

            if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + packageName));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve(new JSObject().put("prompted", true));
            } else {
                call.resolve(new JSObject().put("prompted", false));
            }
        } catch (Exception e) {
            call.resolve(new JSObject().put("prompted", false));
        }
    }

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.M
            || Settings.canDrawOverlays(getContext());
        call.resolve(new JSObject().put("granted", granted));
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        try {
            Context ctx = getContext();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(ctx)) {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + ctx.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
                call.resolve(new JSObject().put("prompted", true));
            } else {
                call.resolve(new JSObject().put("prompted", false));
            }
        } catch (Exception e) {
            call.resolve(new JSObject().put("prompted", false));
        }
    }
}
