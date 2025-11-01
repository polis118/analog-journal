import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.analogjournal.app',
  appName: 'Analog Journal',
  webDir: 'dist/analog-journal/browser',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3880ff'
    }
  }
};

export default config;
