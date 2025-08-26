import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Christians on Campus',
  slug: 'christiansoncampus',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'christiansoncampus',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.alex.christiansoncampuszh',
    buildNumber: '1',
    infoPlist: {
      CFBundleDisplayName: 'Christians on Campus',
      NSCameraUsageDescription: 'This app uses camera for profile photos and event photos',
      NSPhotoLibraryUsageDescription: 'This app uses photo library to select profile photos',
      NSLocationWhenInUseUsageDescription: 'This app uses location to help you find nearby campus events',
      NSCalendarsUsageDescription: 'This app can add events to your calendar',
      NSContactsUsageDescription: 'This app can help you connect with other campus Christians',
      ITSAppUsesNonExemptEncryption: false
    },
    associatedDomains: [
      'applinks:christiansoncampus.app'
    ]
  },
  android: {
    package: 'com.alex.christiansoncampuszh',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION'
    ],
    edgeToEdgeEnabled: true
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }
    ],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          extraPods: [
            {
              name: 'GoogleUtilities',
              modular_headers: true
            },
            {
              name: 'FirebaseCoreInternal',
              modular_headers: true
            },
            {
              name: 'FirebaseCore',
              modular_headers: true
            }
          ]
        },
        android: {
          newArchEnabled: true
        }
      }
    ],
    'expo-web-browser'
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {},
    eas: {
      projectId: process.env.EAS_PROJECT_ID || 'your_eas_project_id_here'
    },
    firebase: {
      EXPO_PUBLIC_FB_API_KEY: process.env.EXPO_PUBLIC_FB_API_KEY || 'your_firebase_api_key_here',
      EXPO_PUBLIC_FB_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN || 'your_project_id.firebaseapp.com',
      EXPO_PUBLIC_FB_PROJECT_ID: process.env.EXPO_PUBLIC_FB_PROJECT_ID || 'your_project_id',
      EXPO_PUBLIC_FB_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET || 'your_project_id.firebasestorage.app',
      EXPO_PUBLIC_FB_MSG_SENDER_ID: process.env.EXPO_PUBLIC_FB_MSG_SENDER_ID || 'your_sender_id',
      EXPO_PUBLIC_FB_APP_ID: process.env.EXPO_PUBLIC_FB_APP_ID || 'your_app_id',
      EXPO_PUBLIC_FB_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FB_MEASUREMENT_ID || 'your_measurement_id'
    },
    googlecloud: {
      EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || 'your_expo_client_id',
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'your_ios_client_id'
    },
    ios: {
      googleServicesFile: './GoogleService-Info.plist'
    }
  },
  owner: 'alexnan'
});
