// CoC-App/contexts/HybridAuthContext.tsx - 混合身份验证方案
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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
  role: UserRole;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
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
  inviteCodeUsed: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  isApproved: boolean; // 管理员审批状态
}

interface HybridAuthContextType {
  // 用户状态
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  
  // 认证操作
  signUp: (
    email: string, 
    password: string, 
    displayName: string, 
    campus: string,
    inviteCode: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // 邀请码管理
  validateInviteCode: (code: string) => Promise<InviteCode>;
  generateInviteCode: (role: UserRole, description?: string, maxUses?: number) => Promise<string>;
  revokeInviteCode: (codeId: string) => Promise<void>;
  getInviteCodes: () => Promise<InviteCode[]>;
  
  // 用户管理
  approveUser: (uid: string) => Promise<void>;
  updateUserRole: (uid: string, role: UserRole) => Promise<void>;
  deactivateUser: (uid: string) => Promise<void>;
  getAllUsers: () => Promise<UserProfile[]>;
  
  // 实用工具
  refreshUserProfile: () => Promise<void>;
}

const HybridAuthContext = createContext<HybridAuthContextType | undefined>(undefined);

export const HybridAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 监听Firebase身份验证状态
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Auth state changed:', user?.email || 'No user');
      
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

  const validateInviteCode = async (code: string): Promise<InviteCode> => {
    try {
      const inviteQuery = query(
        collection(db, 'inviteCodes'),
        where('code', '==', code),
        where('isUsed', '==', false)
      );
      
      const inviteSnapshot = await getDocs(inviteQuery);
      
      if (inviteSnapshot.empty) {
        throw new Error('Invalid or expired invite code');
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

  const signUp = async (
    email: string, 
    password: string, 
    displayName: string, 
    campus: string,
    inviteCode: string
  ) => {
    try {
      // 1. 验证邀请码
      const invite = await validateInviteCode(inviteCode);
      
      // 2. 创建Firebase用户
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // 3. 更新Firebase用户显示名称
      await updateProfile(user, {
        displayName: displayName
      });

      // 4. 创建用户配置文件
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName,
        campus: campus,
        role: invite.role,
        inviteCodeUsed: inviteCode,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        isApproved: invite.role === 'student', // 学生自动批准，管理员需手动批准
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // 5. 更新邀请码使用状态
      await updateDoc(doc(db, 'inviteCodes', invite.id), {
        currentUses: invite.currentUses + 1,
        isUsed: invite.currentUses + 1 >= invite.maxUses,
        [`usedBy.${user.uid}`]: {
          email: user.email,
          displayName: displayName,
          usedAt: new Date().toISOString()
        }
      });

      setUserProfile(userProfile);
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // 清理可能创建的Firebase用户
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
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

      // 检查用户是否被批准
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        
        if (!profile.isActive) {
          throw new Error('Your account has been deactivated. Contact administrator.');
        }
        
        if (!profile.isApproved) {
          throw new Error('Your account is pending approval. Please wait for administrator approval.');
        }
      }
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
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
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
      // 生成邀请码
      const prefix = role === 'admin' ? 'AD' : role === 'core_member' ? 'CM' : 'ST';
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      
      let code = prefix + '-';
      for (let i = 0; i < 6; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
          segment += chars[Math.floor(Math.random() * chars.length)];
        }
        code += segment + (i < 5 ? '-' : '');
      }

      const inviteCode: Omit<InviteCode, 'id'> = {
        code,
        role,
        createdBy: currentUser!.uid,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天过期
        isUsed: false,
        maxUses,
        currentUses: 0,
        description,
      };

      const docRef = await addDoc(collection(db, 'inviteCodes'), inviteCode);
      console.log('Generated invite code:', code);
      
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

  const approveUser = async (uid: string) => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only administrators can approve users');
    }

    try {
      await updateDoc(doc(db, 'users', uid), {
        isApproved: true,
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser!.uid
      });
    } catch (error) {
      console.error('Error approving user:', error);
      throw new Error('Failed to approve user');
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
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  };

  const deactivateUser = async (uid: string) => {
    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Only administrators can deactivate users');
    }

    try {
      await updateDoc(doc(db, 'users', uid), {
        isActive: false,
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: currentUser!.uid
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw new Error('Failed to deactivate user');
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

  const refreshUserProfile = async () => {
    if (!currentUser) return;
    await loadUserProfile(currentUser.uid);
  };

  const value: HybridAuthContextType = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut: handleSignOut,
    validateInviteCode,
    generateInviteCode,
    revokeInviteCode,
    getInviteCodes,
    approveUser,
    updateUserRole,
    deactivateUser,
    getAllUsers,
    refreshUserProfile,
  };

  return (
    <HybridAuthContext.Provider value={value}>
      {children}
    </HybridAuthContext.Provider>
  );
};

export const useHybridAuth = () => {
  const context = useContext(HybridAuthContext);
  if (context === undefined) {
    throw new Error('useHybridAuth must be used within a HybridAuthProvider');
  }
  return context;
};