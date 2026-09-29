import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tmp.matreshka',
  appName: 'matreshka',
  webDir: 'dist/matreshka/browser',
  server: {
    cleartext: true, // Android запрещает подключение к серверам, не защищенных SSL, данное правило нужно для обхода ограничения при разработке
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
