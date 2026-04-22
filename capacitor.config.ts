import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.tuviapp.app',
  appName: 'Tử Vi Việt Nam',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#0a0118',
      launchShowDuration: 2000,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0118',
    },
    Keyboard: {
      resize: 'ionic',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    SocialLogin: {
      google: {
        // Web Client ID (không phải Android Client ID) — cùng credential đã config trong Supabase Google provider
        webClientId: '529338826106-ojnpj2gtitnoct8np861v54et59saeb3.apps.googleusercontent.com',
      },
    },
  },
};

export default config;
