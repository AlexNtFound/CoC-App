// CoC-App/contexts/IntegratedAuthContext.tsx - 集成Firebase Auth和邀请码系统
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { FirebaseUserProfile, useFirebaseAuth } from './FirebaseAuthContext';
import { CurrentUserSession, useInviteCode } from './InviteCodeContext';
import { UserRole, useUserRole } from './UserRoleContext';

export interface IntegratedAuthUser {
  // 基本用户信息
  uid?: string; // Firebase UID (如果使用Firebase登录)
  displayName: string;
  email?: string;
  campus: string;
  role: UserRole;
  
  // 认证方式
  authMethod: 'firebase' | 'invite_code';
  
  // 时间戳
  createdAt: string;
  lastLoginAt: string;
  
  // 状态
  isActive: boolean;
  
  // 邀请码信息（如果适用）
  inviteCode?: string;
  
  // Firebase特定信息
  firebaseProfile?: FirebaseUserProfile;
  
  // 邀请码特定信息
  inviteSession?: CurrentUserSession;
}

interface IntegratedAuthContextType {
  // 用户状态
  user: IntegratedAuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // 认证操作
  signInWithFirebase: (email: string, password: string) => Promise<void>;
  signUpWithFirebase: (
    email: string, 
    password: string, 
    displayName: string, 
    campus: string,
    inviteCode: string
  ) => Promise<void>;
  signInWithInviteCode: (
    code: string, 
    userInfo: { name: string; campus: string; email?: string }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  
  // 用户管理
  updateProfile: (updates: Partial<Pick<IntegratedAuthUser, 'displayName' | 'campus' | 'email'>>) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  
  // 实用工具
  refreshUser: () => Promise<void>;
  switchAuthMethod: () => Promise<void>; // 从邀请码升级到Firebase或反之
}

const IntegratedAuthContext = createContext<IntegratedAuthContextType | undefined>(undefined);

export const IntegratedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, loading: firebaseLoading, signIn: firebaseSignIn, signUp: firebaseSignUp, signOut: firebaseSignOut, updateUserProfile: updateFirebaseProfile, deleteAccount: deleteFirebaseAccount } = useFirebaseAuth();
  const { currentSession, activateInviteCode, logout: inviteLogout } = useInviteCode();
  const { userRole, updateUserRole } = useUserRole();
  
  const [user, setUser] = useState<IntegratedAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 监听认证状态变化并同步用户数据
  useEffect(() => {
    syncUserData();
  }, [currentUser, userProfile, currentSession]);

  const syncUserData = async () => {
    setLoading(true);
    
    try {
      let integratedUser: IntegratedAuthUser | null = null;

      // Firebase用户优先级较高
      if (currentUser && userProfile) {
        integratedUser = {
          uid: currentUser.uid,
          displayName: userProfile.displayName,
          email: userProfile.email,
          campus: userProfile.campus,
          role: userProfile.role,
          authMethod: 'firebase',
          createdAt: userProfile.createdAt,
          lastLoginAt: userProfile.lastLoginAt,
          isActive: userProfile.isActive,
          inviteCode: userProfile.inviteCode,
          firebaseProfile: userProfile,
        };
        
        // 同步角色到UserRoleContext
        updateUserRole(userProfile.role);
      } 
      // 如果没有Firebase用户但有邀请码会话
      else if (currentSession.isAuthenticated && currentSession.userInfo) {
        integratedUser = {
          displayName: currentSession.userInfo.name,
          email: currentSession.userInfo.email,
          campus: currentSession.userInfo.campus,
          role: currentSession.role,
          authMethod: 'invite_code',
          createdAt: currentSession.authenticatedAt || new Date().toISOString(),
          lastLoginAt: currentSession.authenticatedAt || new Date().toISOString(),
          isActive: true,
          inviteCode: currentSession.inviteCode || undefined,
          inviteSession: currentSession,
        };
        
        // 同步角色到UserRoleContext
        updateUserRole(currentSession.role);
      }

      setUser(integratedUser);
    } catch (error) {
      console.error('Error syncing user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithFirebase = async (email: string, password: string) => {
    try {
      const { profile } = await firebaseSignIn(email, password);
      
      // 如果有活跃的邀请码会话，可能需要处理数据迁移
      if (currentSession.isAuthenticated) {
        console.log('User had invite code session, migrating data...');
        // 这里可以添加数据迁移逻辑
      }
    } catch (error) {
      console.error('Firebase sign in error:', error);
      throw error;
    }
  };

  const signUpWithFirebase = async (
    email: string, 
    password: string, 
    displayName: string, 
    campus: string,
    inviteCode: string
  ) => {
    try {
      // 这里你可能需要验证邀请码来确定用户角色
      // 暂时使用默认角色
      const role: UserRole = 'student'; // 可以基于邀请码逻辑来确定
      
      const { profile } = await firebaseSignUp(
        email, 
        password, 
        displayName, 
        campus, 
        inviteCode, 
        role
      );
      
      // 清理邀请码会话（如果存在）
      if (currentSession.isAuthenticated) {
        await inviteLogout();
      }
    } catch (error) {
      console.error('Firebase sign up error:', error);
      throw error;
    }
  };

  const signInWithInviteCode = async (
    code: string, 
    userInfo: { name: string; campus: string; email?: string }
  ) => {
    try {
      const success = await activateInviteCode(code, userInfo, updateUserRole);
      
      if (success) {
        // 如果有Firebase用户登录，可能需要处理冲突
        if (currentUser) {
          console.log('User has Firebase account, consider upgrading...');
          // 可以提示用户升级或处理账户合并
        }
      }
    } catch (error) {
      console.error('Invite code sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // 同时登出Firebase和邀请码系统
      await Promise.all([
        currentUser ? firebaseSignOut() : Promise.resolve(),
        currentSession.isAuthenticated ? inviteLogout() : Promise.resolve()
      ]);
      
      setUser(null);
      updateUserRole('student'); // 重置为默认角色
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Pick<IntegratedAuthUser, 'displayName' | 'campus' | 'email'>>) => {
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      if (user.authMethod === 'firebase' && currentUser && userProfile) {
        // 更新Firebase用户配置文件
        const firebaseUpdates: Partial<Pick<FirebaseUserProfile, 'displayName' | 'campus'>> = {};
        
        if (updates.displayName) firebaseUpdates.displayName = updates.displayName;
        if (updates.campus) firebaseUpdates.campus = updates.campus;
        
        await updateFirebaseProfile(firebaseUpdates);
      } else if (user.authMethod === 'invite_code') {
        // 对于邀请码用户，更新本地会话数据
        // 注意：这可能需要扩展InviteCodeContext来支持更新用户信息
        console.log('Updating invite code user profile:', updates);
        // 这里需要实现邀请码用户的配置文件更新逻辑
      }

      // 刷新用户数据
      await syncUserData();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const deleteAccount = async (password?: string) => {
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      if (user.authMethod === 'firebase' && password) {
        await deleteFirebaseAccount(password);
      } else if (user.authMethod === 'invite_code') {
        await inviteLogout(); // 对于邀请码用户，只需登出
      }

      setUser(null);
      updateUserRole('student');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await syncUserData();
  };

  const switchAuthMethod = async () => {
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // 这是一个复杂的操作，需要仔细设计
    // 例如：从邀请码升级到Firebase账户，或从Firebase降级到邀请码
    console.log('switchAuthMethod not yet implemented');
    throw new Error('Account migration is not yet implemented');
  };

  const value: IntegratedAuthContextType = {
    user,
    loading: loading || firebaseLoading,
    isAuthenticated: user !== null,
    signInWithFirebase,
    signUpWithFirebase,
    signInWithInviteCode,
    signOut,
    updateProfile,
    deleteAccount,
    refreshUser,
    switchAuthMethod,
  };

  return (
    <IntegratedAuthContext.Provider value={value}>
      {children}
    </IntegratedAuthContext.Provider>
  );
};

export const useIntegratedAuth = () => {
  const context = useContext(IntegratedAuthContext);
  if (context === undefined) {
    throw new Error('useIntegratedAuth must be used within an IntegratedAuthProvider');
  }
  return context;
};