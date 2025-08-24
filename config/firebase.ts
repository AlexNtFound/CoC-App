// CoC-App/config/firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { getApp, getApps, initializeApp } from 'firebase/app';
import * as Auth from 'firebase/auth';
import { getFirestore /*, connectFirestoreEmulator*/ } from 'firebase/firestore';
import { getStorage /*, connectStorageEmulator*/ } from 'firebase/storage';

// 1) 从 app.json -> expo.extra.firebase 读取（与你截图一致）
const extra: any = Constants.expoConfig?.extra ?? {};
const fb = extra.firebase ?? extra; // 兼容放在 extra 或 extra.firebase

const firebaseConfig = {
  apiKey: fb.EXPO_PUBLIC_FB_API_KEY || fb.FB_API_KEY,
  authDomain: fb.EXPO_PUBLIC_FB_AUTH_DOMAIN || fb.FB_AUTH_DOMAIN,
  projectId: fb.EXPO_PUBLIC_FB_PROJECT_ID || fb.FB_PROJECT_ID,
  storageBucket: fb.EXPO_PUBLIC_FB_STORAGE_BUCKET || fb.FB_STORAGE_BUCKET,
  messagingSenderId: fb.EXPO_PUBLIC_FB_MSG_SENDER_ID || fb.FB_MESSAGING_SENDER_ID,
  appId: fb.EXPO_PUBLIC_FB_APP_ID || fb.FB_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.warn('⚠️ 未读取到 apiKey：检查 app.json -> expo.extra.firebase.EXPO_PUBLIC_FB_API_KEY');
}

// 2) 初始化 App（避免重复初始化）
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 3) RN 下为 Auth 指定持久化（兼容老版 firebase：动态拿 getReactNativePersistence）
const maybeGetRNP =
  (Auth as any).getReactNativePersistence as
    | ((storage: typeof AsyncStorage) => unknown)
    | undefined;

export const auth = (() => {
  try {
    // 首选：用 initializeAuth 指定持久化；如果已初始化会 throw，则走 getAuth
    return Auth.initializeAuth(app, {
      // 老版 firebase 没这个函数时，传 undefined 等价于用内存持久化（至少不报错）
      // 你已经安装了 @react-native-async-storage/async-storage
      // 建议把 firebase 升到较新版本以真正启用持久化
      persistence: maybeGetRNP ? maybeGetRNP(AsyncStorage) : undefined,
    } as any);
  } catch {
    return Auth.getAuth(app);
  }
})();

export const db = getFirestore(app);
export const storage = getStorage(app);

// --- 本地模拟器（可选）---
// if (__DEV__) {
//   // Auth: 需要启用后再连
//   // (Auth as any).connectAuthEmulator?.(auth, 'http://127.0.0.1:9099');
//   // connectFirestoreEmulator(db, '127.0.0.1', 8080);
//   // connectStorageEmulator(storage, '127.0.0.1', 9199);
// }

export default app;