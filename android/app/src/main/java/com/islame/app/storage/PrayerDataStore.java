package com.islame.app.storage;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;

public class PrayerDataStore {
    private static final String PREFS_NAME = "com.islame.app.PRAYER_PREFS";
    private final SharedPreferences prefs;

    public PrayerDataStore(Context context) {
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public void savePrayers(String prayersJson, String lastUpdate) {
        prefs.edit()
            .putString("prayers_json", prayersJson)
            .putString("last_update", lastUpdate)
            .apply();
    }

    public String getPrayersJson() {
        return prefs.getString("prayers_json", "[]");
    }

    public String getLastUpdate() {
        return prefs.getString("last_update", "");
    }

    public void saveMuezzin(String muezzinId) {
        prefs.edit().putString("selected_muezzin", muezzinId).apply();
    }

    public String getSelectedMuezzin() {
        return prefs.getString("selected_muezzin", "makkah");
    }

    public void saveIqamaDelay(int minutes) {
        prefs.edit().putInt("iqama_delay", minutes).apply();
    }

    public int getIqamaDelay() {
        return prefs.getInt("iqama_delay", 10);
    }

    public void saveMutedPrayers(String mutedJson) {
        prefs.edit().putString("muted_prayers", mutedJson).apply();
    }

    public boolean isPrayerMuted(String name) {
        try {
            String json = prefs.getString("muted_prayers", "[]");
            JSONArray array = new JSONArray(json);
            for (int i = 0; i < array.length(); i++) {
                if (array.getString(i).equalsIgnoreCase(name)) return true;
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return false;
    }

    public void setNotificationsEnabled(boolean enabled) {
        prefs.edit().putBoolean("notifications_enabled", enabled).apply();
    }

    public boolean isNotificationsEnabled() {
        return prefs.getBoolean("notifications_enabled", true);
    }

    // ── مدة الأذان ─────────────────────────────────────────────────────
    // القيم: "full" (افتراضي) | "short" (38 ثانية) | "silent" (beep متكرر)
    // - full: الأذان كامل بصوت المؤذن
    // - short: 38 ثانية من الأذان ثم توقف الصوت والكارت العائم فوراً
    // - silent: صوت notification قصير متكرر كل 30 ثانية لمدة 3 دقائق (بدل المؤذن)
    public void setAdhanDurationMode(String mode) {
        prefs.edit().putString("adhan_duration_mode", mode).apply();
    }

    public String getAdhanDurationMode() {
        return prefs.getString("adhan_duration_mode", "full");
    }
}
