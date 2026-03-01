import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myaangan.app',
  appName: 'MyAangan',
  webDir: 'dist/myaangan-frontend',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f3460',
      androidSplashResourceName: 'splash',
      showSpinner: false
    }
  }
};

export default config;
