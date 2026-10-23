package com.islame.app.plugins;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class StopAdhanReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        // وقّف الأذان
        context.stopService(new Intent(context, AdhanPlayerService.class));
        // وقّف الإقامة لو كانت شغّالة
        context.stopService(new Intent(context, IqamaPlayerService.class));
    }
}
