// CoC-App/contexts/FirebaseAuthContext.tsx - Firebase身份验证集成
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import type { UserRole } from './UserRoleContext';

export interface FirebaseUserProfile {
  uid: string;
  email: string;
  displayName: string;
  campus: string;
  role: UserRole;
  inviteCode: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
}

interface FirebaseAuthContextType {
  // 当前用户状态
  currentUser: User | null;
  userProfile: FirebaseUserProfile | null;
  loading: boolean;
  
  // 身份验证操作
  signIn: (email: string, password: string) => Promise<{ user: User; profile: FirebaseUserProfile }>;
  signUp: (
    email: string, 
    password: string, 
    displayName: string, 
    campus: string,
    inviteCode: string,
    role: UserRole
  ) => Promise<{ user: User; profile: FirebaseUserProfile }>;
  signOut: () => Promise<void>;
  
  // 用户管理
  updateUserProfile: (updates: Partial<Pick<FirebaseUserProfile, 'displayName' | 'campus'>>) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // 用户数据管理
  refreshUserProfile: () => Promise<void>;
  
  // 管理员功能
  getAllUsers: () => Promise<FirebaseUserProfile[]>;
  updateUserRole: (uid: string, role: UserRole) => Promise<void>;
  deactivateUser: (uid: string) => Promise<void>;
  reactivateUser: (uid: string) => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export const FirebaseAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<FirebaseUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 监听身份验证状态变化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Auth state changed:', user?.email || 'No user');
      
      setCurrentUser(user);
      
      if (user) {
        // 用户已登录，获取用户配置文件
        await loadUserProfile(user.uid);
      } else {
        // 用户已登出
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as FirebaseUserProfile;
        setUserProfile(profileData);
        
        // 更新最后登录时间
        await updateDoc(doc(db, 'users', uid), {
          lastLoginAt: new Date().toISOString()
        });
      } else {
        console.error('User profile not found in Firestore');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // 获取用户配置文件
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found. Please contact administrator.');
      }

      const profile = userDoc.data() as FirebaseUserProfile;
      
      if (!profile.isActive) {
        throw new Error('Your account has been deactivated. Please contact administrator.');
      }

      // 更新最后登录时间
      const updatedProfile = {
        ...profile,
        lastLoginAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: updatedProfile.lastLoginAt
      });

      setUserProfile(updatedProfile);
      
      return { user, profile: updatedProfile };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    displayName: string,
    campus: string,
    inviteCode: string,
    role: UserRole
  ) => {
    try {
      // 创建Firebase用户账户
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // 更新Firebase用户配置文件
      await updateProfile(user, {
        displayName: displayName
      });

      // 在Firestore中创建用户配置文件
      const userProfile: FirebaseUserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName,
        campus: campus,
        role: role,
        inviteCode: inviteCode,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);

      return { user, profile: userProfile };
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // 如果Firestore操作失败，清理已创建的用户
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (cleanupError) {
          console.error('Failed to cleanup user after signup error:', cleanupError);
        }
      }
      
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  };

  const updateUserProfile = async (updates: Partial<Pick<FirebaseUserProfile, 'displayName' | 'campus'>>) => {
    if (!currentUser || !userProfile) {
      throw new Error('No user is currently signed in');
    }

    try {
      // 更新Firebase用户配置文件
      if (updates.displayName) {
        await updateProfile(currentUser, {
          displayName: updates.displayName
        });
      }

      // 更新Firestore用户文档
      await updateDoc(doc(db, 'users', currentUser.uid), updates);

      // 更新本地状态
      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  };

  const deleteAccount = async (password: string) => {
    if (!currentUser || !userProfile) {
      throw new Error('No user is currently signed in');
    }

    try {
      // 重新验证用户
      const credential = EmailAuthProvider.credential(currentUser.email!, password);
      await reauthenticateWithCredential(currentUser, credential);

      // 删除Firestore文档
      await deleteDoc(doc(db, 'users', currentUser.uid));

      // 删除Firebase用户账户
      await deleteUser(currentUser);

      setCurrentUser(null);
      setUserProfile(null);
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error('Failed to delete account');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error('Failed to send password reset email');
    }
  };

  const refreshUserProfile = async () => {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    await loadUserProfile(currentUser.uid);
  };

  // 管理员功能
  const getAllUsers = async (): Promise<FirebaseUserProfile[]> => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    try {
      // 这里需要使用Firebase Admin SDK或Cloud Functions来获取所有用户
      // 由于客户端限制，我们只能获取有限的用户数据
      // 建议实现一个Cloud Function来处理这个操作
      console.warn('getAllUsers should be implemented using Cloud Functions for security');
      return [];
    } catch (error: any) {
      console.error('Get all users error:', error);
      throw new Error('Failed to fetch users');
    }
  };

  const updateUserRole = async (uid: string, role: UserRole) => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } catch (error: any) {
      console.error('Update user role error:', error);
      throw new Error('Failed to update user role');
    }
  };

  const deactivateUser = async (uid: string) => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    try {
      await updateDoc(doc(db, 'users', uid), { isActive: false });
    } catch (error: any) {
      console.error('Deactivate user error:', error);
      throw new Error('Failed to deactivate user');
    }
  };

  const reactivateUser = async (uid: string) => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    try {
      await updateDoc(doc(db, 'users', uid), { isActive: true });
    } catch (error: any) {
      console.error('Reactivate user error:', error);
      throw new Error('Failed to reactivate user');
    }
  };

  const value: FirebaseAuthContextType = {
    currentUser,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut: handleSignOut,
    updateUserProfile,
    deleteAccount,
    resetPassword,
    refreshUserProfile,
    getAllUsers,
    updateUserRole,
    deactivateUser,
    reactivateUser,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};