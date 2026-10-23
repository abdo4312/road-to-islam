package com.islame.app;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.islame.app.plugins.PrayerAlarmPlugin;
import com.islame.app.worker.PrayerRescheduleWorker;
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // تسجيل صريح للـ plugin الصح قبل super.onCreate()
        // يمنع أي التباس في auto-discovery
        registerPlugin(PrayerAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        PrayerRescheduleWorker.start(this);
    }
}
