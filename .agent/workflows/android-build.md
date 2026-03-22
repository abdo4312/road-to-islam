---
description: How to build the Android application using Capacitor and Android Studio
---

Follow these steps to build and run your application on Android:

### 1. Build the Web Application
First, you need to generate the production build of your React app:
```bash
npm run build
```
This will create a `dist` folder with the compiled web assets.

### 2. Sync with Android Project
Copy the web assets into the Android native project:
```bash
npx cap sync android
```
> [!NOTE]
> If you haven't added the android platform yet, run: `npx cap add android`

### 3. Open in Android Studio
Launch Android Studio with the project pre-loaded:
```bash
npx cap open android
```

### 4. Build in Android Studio
Once Android Studio is open and finished indexing:
1. Connect your Android device or start an Emulator.
2. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once finished, a notification will appear. Click **locate** to find the `app-debug.apk`.

### 5. Run on Device (Optional)
To run directly from Android Studio:
- Click the **Run** button (Green Play Icon) in the top toolbar.
