import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.islame.app',
  appName: 'Islame',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
