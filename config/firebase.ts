// CoC-App/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyDBRBTJU6onbmqYgIKlHDLofFVKj7Am6i0",
  authDomain: "christians-on-campus-f792d.firebaseapp.com",
  projectId: "christians-on-campus-f792d",
  storageBucket: "christians-on-campus-f792d.firebasestorage.app",
  messagingSenderId: "232802687776",
  appId: "1:232802687776:web:4dccb4322012e8b41d1545",
  measurementId: "G-LX5VLFYVZQ"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 获取Firebase服务
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 开发环境下连接本地模拟器（可选）
if (__DEV__) {
  // 如果你想使用Firebase模拟器进行本地开发，取消注释下面的代码
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;