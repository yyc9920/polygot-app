import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.polyglot.app',
  appName: 'Polyglot',
  webDir: 'dist',
  
  server: {
    allowNavigation: [
      'https://*.googleapis.com',
      'https://*.firebaseio.com',
      'https://*.firebase.google.com',
      'https://generativelanguage.googleapis.com',
    ],
  },
  
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    backgroundColor: '#ffffff',
  },
  
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
  },
  
  plugins: {
    Preferences: {
      group: 'com.polyglot.app',
    },
  },
};

export default config;
