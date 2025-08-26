// CoC-App/contexts/OpenAccessAuthContext.tsx - 开放访问 + 权限升级系统 + Google登录
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import type { UserRole } from './UserRoleContext';

// 完成WebBrowser设置用于Google登录
WebBrowser.maybeCompleteAuthSession();

export interface InviteCode {
  id: string;
  code: string;
  role: UserRole; // 'core_member' 或 'admin'
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedBy?: string[];
  maxUses: number;
  currentUses: number;
  description?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  campus: string;
  role: UserRole;
  inviteCodeUsed?: string; // 用于升级权限的邀请码
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  // 添加登录方式标识
  authProvider: 'email' | 'google';
  photoURL?: string; // Google用户头像
  // 权限升级历史
  roleHistory?: {
    previousRole: UserRole;
    newRole: UserRole;
    upgradeDate: string;
    inviteCodeUsed: string;
  }[];
}

interface OpenAccessAuthContextType {
  // 用户状态
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isGuest: boolean; // 未登录用户
  
  // 基础认证操作
  signUp: (email: string, password: string, displayName: string, campus: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // 权限升级
  upgradeRole: (inviteCode: string) => Promise<UserRole>;
  validateInviteCode: (code: string) => Promise<InviteCode>;
  
  // 管理员功能（需要admin权限）
  generateInviteCode: (role: UserRole, description?: string, maxUses?: number) => Promise<string>;
  revokeInviteCode: (codeId: string) => Promise<void>;
  getInviteCodes: () => Promise<InviteCode[]>;
  getAllUsers: () => Promise<UserProfile[]>;
  updateUserRole: (uid: string, role: UserRole) => Promise<void>;
  
  // 用户管理
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'campus'>>) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  
  // 权限检查
  canRegisterForEvents: boolean;
  canCreateEvents: boolean;
  canManageUsers: boolean;
  canManageInviteCodes: boolean;
}

const OpenAccessAuthContext = createContext<OpenAccessAuthContextType | undefined>(undefined);

export const OpenAccessAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const g = (Constants.expoConfig?.extra as any)?.googlecloud || {};
  const owner = 'alexnan';           // ← 如果你的 Expo owner 不是这个，改成你的
  const slug  = 'ChristiansOnCampus';    // ← 改成你的 expo.slug
  const redirectUri = `https://auth.expo.io/@${owner}/${slug}`;
  console.log('clientId =', (Constants.expoConfig?.extra as any)?.googlecloud?.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID);
  console.log('redirectUri =', redirectUri); // 这一行你前面已经定义好了

  // Google OAuth配置 - 从app.json中读取配置
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: g.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,     // 只填“Web application”的 clientId
    iosClientId: g.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ['openid', 'email', 'profile'],
    // 不传 redirectUri，交给库自动生成
  });

  console.log('AUTO redirectUri =', request?.redirectUri);

  // 处理Google OAuth响应
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleAuthSuccess(authentication);
    }
  }, [response]);

  // 监听Firebase身份验证状态
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Auth state changed:', user?.email || 'Guest user');
      
      setCurrentUser(user);
      
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleGoogleAuthSuccess = async (authentication: any) => {
    try {
      const { accessToken, idToken } = authentication;
      
      // 创建Google凭据
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      
      // 使用凭据登录Firebase
      const result = await signInWithCredential(auth, credential);
      const user = result.user;

      // 检查是否为新用户
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // 新用户 - 创建用户配置文件
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'Google User',
          campus: '', // 需要用户后续填写
          role: 'student', // 默认角色
          authProvider: 'google',
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          isActive: true,
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);
        console.log('✅ New Google user created successfully');

        // 如果campus为空，可以引导用户完善信息
        if (!userProfile.campus) {
          // 这里可以弹出模态框让用户填写campus信息
          console.log('📝 User needs to complete profile with campus info');
        }
      } else {
        // 现有用户 - 更新最后登录时间
        await updateDoc(doc(db, 'users', user.uid), {
          lastLoginAt: new Date().toISOString()
        });
        console.log('✅ Existing Google user signed in');
      }

    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  const loadUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        setUserProfile(profileData);
        
        // 更新最后登录时间
        await updateDoc(doc(db, 'users', uid), {
          lastLoginAt: new Date().toISOString()
        });
      } else {
        console.error('User profile not found');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    displayName: string, 
    campus: string
  ) => {
    try {
      // 创建Firebase用户
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // 更新Firebase用户显示名称
      await updateProfile(user, {
        displayName: displayName
      });

      // 创建用户配置文件 - 默认为student角色
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName,
        campus: campus,
        role: 'student', // 默认角色
        authProvider: 'email',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);

      console.log('✅ User created successfully with student role');
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // 清理可能创建的Firebase用户
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (cleanupError) {
          console.error('Failed to cleanup user:', cleanupError);
        }
      }
      
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // 检查用户状态
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        
        if (!profile.isActive) {
          throw new Error('Your account has been deactivated. Contact administrator.');
        }
      }

      console.log('✅ User signed in successfully');
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signInWithGoogle = async () => {
    try {
      await promptAsync(); // 已在 request 里指定了 redirectUri=https://auth.expo.io/...
    } catch (e:any) {
      console.error('Google sign-in initiation error:', e);
      throw new Error('Failed to initiate Google sign-in');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      console.log('✅ User signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error('Failed to send password reset email');
    }
  };

  const validateInviteCode = async (code: string): Promise<InviteCode> => {
    try {
      const inviteQuery = query(
        collection(db, 'inviteCodes'),
        where('code', '==', code)
      );
      
      const inviteSnapshot = await getDocs(inviteQuery);
      
      if (inviteSnapshot.empty) {
        throw new Error('Invalid invite code');
      }

      const inviteDoc = inviteSnapshot.docs[0];
      const inviteData = inviteDoc.data() as Omit<InviteCode, 'id'>;
      
      return {
        id: inviteDoc.id,
        ...inviteData
      } as InviteCode;

    } catch (error: any) {
      console.error('Validate invite code error:', error);
      throw new Error('Failed to validate invite code');
    }
  };

  const upgradeRole = async (inviteCode: string): Promise<UserRole> => {
    if (!currentUser || !userProfile) {
      throw new Error('You must be signed in to upgrade your role');
    }

    try {
      // 验证邀请码
      const inviteCodeData = await validateInviteCode(inviteCode);
      
      // 检查邀请码状态
      if (inviteCodeData.currentUses >= inviteCodeData.maxUses) {
        throw new Error('Invite code has reached maximum usage limit');
      }

      if (new Date(inviteCodeData.expiresAt) < new Date()) {
        throw new Error('Invite code has expired');
      }

      const currentRole = userProfile.role;
      const newRole = inviteCodeData.role;

      // 检查角色升级逻辑
      const roleHierarchy: Record<UserRole, number> = {
        'student': 0,
        'core_member': 1,
        'admin': 2
      };

      if (roleHierarchy[newRole] <= roleHierarchy[currentRole]) {
        throw new Error('This invite code cannot upgrade your current role');
      }

      // 更新用户角色
      const roleHistoryEntry = {
        previousRole: currentRole,
        newRole: newRole,
        upgradeDate: new Date().toISOString(),
        inviteCodeUsed: inviteCode
      };

      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: newRole,
        inviteCodeUsed: inviteCode,
        roleHistory: [...(userProfile.roleHistory || []), roleHistoryEntry]
      });

      // 更新邀请码使用次数
      await updateDoc(doc(db, 'inviteCodes', inviteCodeData.id), {
        currentUses: inviteCodeData.currentUses + 1,
        usedBy: [...(inviteCodeData.usedBy || []), currentUser.uid]
      });

      // 刷新用户配置文件
      await loadUserProfile(currentUser.uid);

      console.log('✅ Role upgraded successfully');
      return newRole;

    } catch (error: any) {
      console.error('Upgrade role error:', error);
      throw new Error(error.message || 'Failed to upgrade role');
    }
  };

  const generateInviteCode = async (
    role: UserRole, 
    description?: string, 
    maxUses: number = 1
  ): Promise<string> => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only administrators can generate invite codes');
    }

    try {
      const code = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      const inviteCodeData = {
        code,
        role,
        createdBy: currentUser!.uid,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后过期
        isUsed: false,
        usedBy: [],
        maxUses,
        currentUses: 0,
        description: description || `Invite code for ${role} role`
      };

      await addDoc(collection(db, 'inviteCodes'), inviteCodeData);
      console.log('✅ Invite code generated');
      return code;

    } catch (error: any) {
      console.error('Generate invite code error:', error);
      throw new Error('Failed to generate invite code');
    }
  };

  const revokeInviteCode = async (codeId: string) => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only administrators can revoke invite codes');
    }

    try {
      await updateDoc(doc(db, 'inviteCodes', codeId), {
        isUsed: true, // 标记为已使用来"撤销"它
        revokedAt: new Date().toISOString(),
        revokedBy: currentUser!.uid
      });
      console.log('✅ Invite code revoked');
    } catch (error: any) {
      console.error('Revoke invite code error:', error);
      throw new Error('Failed to revoke invite code');
    }
  };

  const getInviteCodes = async (): Promise<InviteCode[]> => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only administrators can view invite codes');
    }

    try {
      const inviteQuery = query(collection(db, 'inviteCodes'));
      const snapshot = await getDocs(inviteQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InviteCode));
    } catch (error) {
      console.error('Error fetching invite codes:', error);
      throw new Error('Failed to fetch invite codes');
    }
  };

  const getAllUsers = async (): Promise<UserProfile[]> => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only administrators can view all users');
    }

    try {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      
      return snapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  };

  const updateUserRole = async (uid: string, role: UserRole) => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only administrators can update user roles');
    }

    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        roleUpdatedAt: new Date().toISOString(),
        roleUpdatedBy: currentUser!.uid
      });
      console.log('✅ Updated user role');
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  };

  const updateUserProfile = async (updates: Partial<Pick<UserProfile, 'displayName' | 'campus'>>) => {
    if (!currentUser || !userProfile) {
      throw new Error('You must be signed in to update your profile');
    }

    try {
      // 更新Firebase用户显示名称
      if (updates.displayName) {
        await updateProfile(currentUser, {
          displayName: updates.displayName
        });
      }

      // 更新Firestore用户文档
      await updateDoc(doc(db, 'users', currentUser.uid), updates);

      // 刷新本地状态
      await loadUserProfile(currentUser.uid);
      console.log('✅ Profile updated');
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  };

  const deleteAccount = async (password: string) => {
    if (!currentUser || !userProfile) {
      throw new Error('You must be signed in to delete your account');
    }

    try {
      // 重新验证用户（这里需要实现重新认证逻辑）
      // 删除Firestore文档
      // 删除Firebase用户账户
      // 这个实现需要更复杂的逻辑，暂时简化
      throw new Error('Account deletion feature is being implemented');
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error('Failed to delete account');
    }
  };

  const refreshUserProfile = async () => {
    if (!currentUser) return;
    await loadUserProfile(currentUser.uid);
  };

  // 计算权限
  const isGuest = !currentUser;
  const canRegisterForEvents = !isGuest; // 所有认证用户都可以报名活动
  const canCreateEvents = userProfile?.role === 'core_member' || userProfile?.role === 'admin';
  const canManageUsers = userProfile?.role === 'admin';
  const canManageInviteCodes = userProfile?.role === 'admin';

  const value: OpenAccessAuthContextType = {
    // 用户状态
    currentUser,
    userProfile,
    loading,
    isGuest,
    
    // 基础认证操作
    signUp,
    signIn,
    signInWithGoogle,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    
    // 权限升级
    upgradeRole,
    validateInviteCode,
    
    // 管理员功能
    generateInviteCode,
    revokeInviteCode,
    getInviteCodes,
    getAllUsers,
    updateUserRole,
    
    // 用户管理
    updateProfile: updateUserProfile,
    deleteAccount,
    refreshUserProfile,
    
    // 权限检查
    canRegisterForEvents,
    canCreateEvents,
    canManageUsers,
    canManageInviteCodes,
  };

  return (
    <OpenAccessAuthContext.Provider value={value}>
      {children}
    </OpenAccessAuthContext.Provider>
  );
};

export const useOpenAccessAuth = () => {
  const context = useContext(OpenAccessAuthContext);
  if (context === undefined) {
    throw new Error('useOpenAccessAuth must be used within an OpenAccessAuthProvider');
  }
  return context;
};