package com.islame.app.overlay;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.BlurMaskFilter;
import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PathMeasure;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;
import android.view.animation.LinearInterpolator;

public class NeonRingView extends View {

    private Paint glowPaint;
    private Path path;
    private float pathLength;
    private float density;
    private float cornerRadius = 26f;
    private float currentPhase = 0f;

    private float dashLength;
    private float gapLength;

    public NeonRingView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        density = getResources().getDisplayMetrics().density;
        glowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        glowPaint.setStyle(Paint.Style.STROKE);
        glowPaint.setStrokeWidth(22f * density);
        glowPaint.setMaskFilter(new BlurMaskFilter(12f * density, BlurMaskFilter.Blur.NORMAL));
        // Required for BlurMaskFilter to work
        setLayerType(LAYER_TYPE_SOFTWARE, null);
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        if (w <= 0 || h <= 0) return;

        float inset = 6f * density;
        RectF rect = new RectF(inset, inset, w - inset, h - inset);
        
        path = new Path();
        path.addRoundRect(rect, cornerRadius * density, cornerRadius * density, Path.Direction.CW);
        
        PathMeasure pm = new PathMeasure(path, false);
        pathLength = pm.getLength();

        // Comet takes up 20% of the path, 80% gap
        dashLength = pathLength / 5f;
        gapLength = pathLength - dashLength;

        startAnimation();
    }

    private void startAnimation() {
        ValueAnimator anim = ValueAnimator.ofFloat(0, dashLength + gapLength);
        anim.setDuration(3000);
        anim.setRepeatCount(ValueAnimator.INFINITE);
        anim.setInterpolator(new LinearInterpolator());
        anim.addUpdateListener(animation -> {
            currentPhase = (float) animation.getAnimatedValue();
            invalidate();
        });
        anim.start();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (path == null) return;

        // Draw first comet (clockwise) - Neon Green
        glowPaint.setColor(0xFF00FF88);
        glowPaint.setPathEffect(new DashPathEffect(new float[]{dashLength, gapLength}, -currentPhase));
        canvas.drawPath(path, glowPaint);

        // Draw second comet (counter-clockwise) - Neon Cyan
        glowPaint.setColor(0xFF00E5FF);
        glowPaint.setPathEffect(new DashPathEffect(new float[]{dashLength, gapLength}, currentPhase));
        canvas.drawPath(path, glowPaint);
    }
}
