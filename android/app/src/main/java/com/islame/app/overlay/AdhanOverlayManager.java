package com.islame.app.overlay;

import android.animation.ValueAnimator;
import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.LinearInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.NonNull;

import com.islame.app.R;
import com.islame.app.plugins.StopAdhanReceiver;

public class AdhanOverlayManager {

    private static final int THRESHOLD_DP = 150;
    private static final int Y_OFFSET_DP = 80;
    private static final int SIDE_MARGIN_DP = 12;
    private static final int CARD_WIDTH_DP = 340;
    private static final long NEON_ROTATION_MS = 3000L;
    private static final float MIN_ALPHA = 0.4f;

    private static final Object LOCK = new Object();
    private static boolean isShowing = false;
    private static View overlayView;
    private static WindowManager windowManager;
    private static WindowManager.LayoutParams params;
    private static ValueAnimator currentAnimator;
    private static ValueAnimator ringAnimator;
    private static float initialTouchX;
    private static int initialParamsX;


    public static boolean canShowOverlay(Context context) {
        boolean allowed = Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(context);
        Log.d("AdhanOverlay", "canShowOverlay = " + allowed);
        return allowed;
    }

    public static void show(Context context, String prayerTitle) {
        Log.d("AdhanOverlay", "show() called, prayerTitle=" + prayerTitle);
        synchronized (LOCK) {
            if (isShowing) {
                hideInternal();
            }
            if (!canShowOverlay(context)) {
                Log.d("AdhanOverlay", "show() ABORTED — overlay permission not granted");
                return;
            }
            try {
                windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
                if (windowManager == null) {
                    return;
                }
                LayoutInflater inflater = LayoutInflater.from(context);
                overlayView = inflater.inflate(R.layout.overlay_adhan_card, null);
                overlayView.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
                TextView titleView = overlayView.findViewById(R.id.overlay_prayer_title);
                if (titleView != null) {
                    titleView.setText(prayerTitle);
                }
                ImageButton stopButton = overlayView.findViewById(R.id.overlay_stop_button);
                stopButton.setOnClickListener(v -> dismissAndStopAdhan(context));
                DisplayMetrics dm = context.getResources().getDisplayMetrics();
                final int screenWidth = dm.widthPixels;
                int sideMargin = (int) (SIDE_MARGIN_DP * dm.density);
                int cardWidth = (int) (CARD_WIDTH_DP * dm.density);
                int width = Math.min(cardWidth, screenWidth - sideMargin * 2);
                int type;
                if (Build.VERSION.SDK_INT >= 26) {
                    type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
                } else {
                    type = WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;
                }
                params = new WindowManager.LayoutParams(
                        width,
                        WindowManager.LayoutParams.WRAP_CONTENT,
                        type,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                                | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                        PixelFormat.TRANSLUCENT);
                params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
                params.y = (int) (Y_OFFSET_DP * dm.density);

                overlayView.setOnTouchListener(new View.OnTouchListener() {
                    @Override
                    public boolean onTouch(View v, MotionEvent event) {
                        switch (event.getAction()) {
                            case MotionEvent.ACTION_DOWN:
                                if (params == null) {
                                    return false;
                                }
                                initializeTouch(event);
                                return true;
                            case MotionEvent.ACTION_MOVE:
                                if (params == null) {
                                    return false;
                                }
                                float delta = event.getRawX() - initialTouchX;
                                params.x = (int) (initialParamsX + delta);
                                try {
                                    if (windowManager != null && overlayView != null) {
                                        windowManager.updateViewLayout(overlayView, params);
                                        float alpha = 1f - (Math.abs(delta) / screenWidth) * 0.6f;
                                        alpha = Math.max(alpha, MIN_ALPHA);
                                        overlayView.setAlpha(alpha);
                                    }
                                } catch (IllegalArgumentException e) {
                                    return false;
                                }
                                return true;
                            case MotionEvent.ACTION_UP:
                            case MotionEvent.ACTION_CANCEL:
                                if (params == null) {
                                    return false;
                                }
                                float delta2 = event.getRawX() - initialTouchX;
                                int threshold = (int) (THRESHOLD_DP * dm.density);
                                if (Math.abs(delta2) > threshold) {
                                    animateOut(context, delta2 > 0);
                                } else {
                                    animateBack();
                                }
                                return true;
                            default:
                                return false;
                        }
                    }
                });

                if (currentAnimator != null) {
                    currentAnimator.cancel();
                    currentAnimator = null;
                }
                windowManager.addView(overlayView, params);
                isShowing = true;

                View ring = overlayView.findViewById(R.id.overlay_neon_ring);
                if (ring != null) {
                    overlayView.post(() -> {
                        int cardWidthPx = overlayView.getWidth();
                        int cardHeightPx = overlayView.getHeight();

                        ViewGroup.LayoutParams ringLp = ring.getLayoutParams();
                        ringLp.width = cardWidthPx;
                        ringLp.height = cardHeightPx;
                        if (ringLp instanceof FrameLayout.LayoutParams) {
                            ((FrameLayout.LayoutParams) ringLp).gravity = Gravity.CENTER;
                        }
                        ring.setLayoutParams(ringLp);
                    });
                }
            } catch (Exception e) {
                e.printStackTrace();
                Log.e("AdhanOverlay", "show() threw exception", e);
                hideInternal();
            }
        }
    }

    public static void hide() {
        synchronized (LOCK) {
            hideInternal();
        }
    }

    private static void hideInternal() {
        if (currentAnimator != null) {
            currentAnimator.cancel();
            currentAnimator = null;
        }
        if (ringAnimator != null) {
            ringAnimator.cancel();
            ringAnimator = null;
        }
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayView);
            } catch (IllegalArgumentException ignored) {
            }
        }
        overlayView = null;
        windowManager = null;
        params = null;
        isShowing = false;
    }

    public static boolean isShowing() {
        synchronized (LOCK) {
            return isShowing;
        }
    }

    private static void initializeTouch(MotionEvent event) {
        initialTouchX = event.getRawX();
        initialParamsX = params.x;
    }

    private static void animateOut(Context context, boolean toRight) {
        if (windowManager == null || params == null || overlayView == null) {
            return;
        }
        DisplayMetrics dm = context.getResources().getDisplayMetrics();
        int screenWidth = dm.widthPixels;
        int startX = params.x;
        int endX = toRight ? screenWidth : -screenWidth;
        currentAnimator = ValueAnimator.ofInt(startX, endX);
        currentAnimator.setDuration(200);
        currentAnimator.addUpdateListener(animator -> {
            if (params == null || overlayView == null || windowManager == null) {
                currentAnimator.cancel();
                return;
            }
            try {
                params.x = (Integer) animator.getAnimatedValue();
                windowManager.updateViewLayout(overlayView, params);
            } catch (IllegalArgumentException e) {
                currentAnimator.cancel();
            }
        });
        currentAnimator.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                currentAnimator = null;
                dismissAndStopAdhan(context);
            }

            @Override
            public void onAnimationCancel(Animator animation) {
                currentAnimator = null;
            }
        });
        currentAnimator.start();
    }

    private static void animateBack() {
        if (params == null || windowManager == null || overlayView == null) {
            return;
        }
        currentAnimator = ValueAnimator.ofInt(params.x, 0);
        currentAnimator.setDuration(200);
        currentAnimator.setInterpolator(new DecelerateInterpolator());
        currentAnimator.addUpdateListener(animator -> {
            if (params == null || overlayView == null || windowManager == null) {
                currentAnimator.cancel();
                return;
            }
            try {
                params.x = (Integer) animator.getAnimatedValue();
                windowManager.updateViewLayout(overlayView, params);
            } catch (IllegalArgumentException e) {
                currentAnimator.cancel();
            }
        });
        currentAnimator.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                currentAnimator = null;
                if (overlayView != null) {
                    overlayView.setAlpha(1f);
                }
            }

            @Override
            public void onAnimationCancel(Animator animation) {
                currentAnimator = null;
            }
        });
        currentAnimator.start();
    }

    private static void dismissAndStopAdhan(Context context) {
        hideInternal();
        Intent intent = new Intent(context, StopAdhanReceiver.class);
        intent.setAction("com.islame.app.STOP_ADHAN");
        context.sendBroadcast(intent);
    }
}
