// CoC-App/contexts/OpenAccessAuthContext.tsx - 开放访问 + 权限升级系统
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
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
      const inviteData = { id: inviteDoc.id, ...inviteDoc.data() } as InviteCode;

      // 检查是否过期
      if (new Date(inviteData.expiresAt) < new Date()) {
        throw new Error('Invite code has expired');
      }

      // 检查使用次数限制
      if (inviteData.currentUses >= inviteData.maxUses) {
        throw new Error('Invite code has reached maximum usage limit');
      }

      return inviteData;
    } catch (error) {
      console.error('Error validating invite code:', error);
      throw error;
    }
  };

  const upgradeRole = async (inviteCode: string): Promise<UserRole> => {
    if (!currentUser || !userProfile) {
      throw new Error('You must be signed in to upgrade your role');
    }

    try {
      // 验证邀请码
      const invite = await validateInviteCode(inviteCode);
      
      // 检查是否已经有更高或相同权限
      const roleHierarchy: Record<UserRole, number> = {
        'student': 0,
        'core_member': 1,
        'admin': 2
      };

      if (roleHierarchy[userProfile.role] >= roleHierarchy[invite.role]) {
        throw new Error(`You already have ${userProfile.role} role or higher`);
      }

      // 更新用户角色
      const roleHistoryEntry = {
        previousRole: userProfile.role,
        newRole: invite.role,
        upgradeDate: new Date().toISOString(),
        inviteCodeUsed: inviteCode
      };

      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: invite.role,
        inviteCodeUsed: inviteCode,
        roleHistory: [...(userProfile.roleHistory || []), roleHistoryEntry],
        roleUpgradedAt: new Date().toISOString()
      });

      // 更新邀请码使用状态
      const newUsedBy = [...(invite.usedBy || []), currentUser.uid];
      const newCurrentUses = invite.currentUses + 1;

      await updateDoc(doc(db, 'inviteCodes', invite.id), {
        usedBy: newUsedBy,
        currentUses: newCurrentUses,
        isUsed: newCurrentUses >= invite.maxUses,
        [`usageHistory.${currentUser.uid}`]: {
          email: currentUser.email,
          displayName: userProfile.displayName,
          previousRole: userProfile.role,
          newRole: invite.role,
          usedAt: new Date().toISOString()
        }
      });

      // 刷新用户配置文件
      await loadUserProfile(currentUser.uid);

      console.log(`✅ Role upgraded from ${userProfile.role} to ${invite.role}`);
      return invite.role;
    } catch (error) {
      console.error('Error upgrading role:', error);
      throw error;
    }
  };

  const generateInviteCode = async (
    role: UserRole, 
    description?: string, 
    maxUses: number = 10
  ): Promise<string> => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only administrators can generate invite codes');
    }

    try {
      // 生成邀请码
      const prefix = role === 'admin' ? 'AD' : 'CM'; // 只允许生成core_member和admin码
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      
      let code = prefix + '-';
      for (let i = 0; i < 4; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
          segment += chars[Math.floor(Math.random() * chars.length)];
        }
        code += segment + (i < 3 ? '-' : '');
      }

      const inviteCode: Omit<InviteCode, 'id'> = {
        code,
        role,
        createdBy: currentUser!.uid,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90天过期
        isUsed: false,
        maxUses,
        currentUses: 0,
        description,
      };

      await addDoc(collection(db, 'inviteCodes'), inviteCode);
      console.log('✅ Generated invite code:', code);
      
      return code;
    } catch (error) {
      console.error('Error generating invite code:', error);
      throw new Error('Failed to generate invite code');
    }
  };

  const revokeInviteCode = async (codeId: string) => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only administrators can revoke invite codes');
    }

    try {
      await updateDoc(doc(db, 'inviteCodes', codeId), {
        isUsed: true,
        revokedAt: new Date().toISOString(),
        revokedBy: currentUser!.uid
      });
      console.log('✅ Revoked invite code');
    } catch (error) {
      console.error('Error revoking invite code:', error);
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
  const canRegisterForEvents = !!currentUser; // 任何登录用户都可以注册活动
  const canCreateEvents = userProfile?.role === 'core_member' || userProfile?.role === 'admin';
  const canManageUsers = userProfile?.role === 'admin';
  const canManageInviteCodes = userProfile?.role === 'admin';

  const value: OpenAccessAuthContextType = {
    currentUser,
    userProfile,
    loading,
    isGuest,
    signUp,
    signIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    upgradeRole,
    validateInviteCode,
    generateInviteCode,
    revokeInviteCode,
    getInviteCodes,
    getAllUsers,
    updateUserRole,
    updateProfile: updateUserProfile,
    deleteAccount,
    refreshUserProfile,
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