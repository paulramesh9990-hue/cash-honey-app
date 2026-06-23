import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cashhoney.app',
  appName: 'Cash Honey',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://paulramesh9990-hue.github.io/cash-honey-app/',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#F59E0B',
      showSpinner: true,
      spinnerColor: '#FFFFFF',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F59E0B',
    },
    App: {
      // Deep linking scheme
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#F59E0B',
  },
};

export default config;
