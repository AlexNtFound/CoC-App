// CoC-App/contexts/InviteCodeContext.tsx - Fixed version with proper role integration
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { UserRole } from './UserRoleContext';

export interface DeviceFingerprint {
  deviceId: string;
  brand: string;
  model: string;
  systemVersion: string;
  bundleId: string;
  installTime: number;
}

export interface InviteCodeData {
  code: string;
  role: UserRole;
  createdAt: string;
  createdFor: string;
  isUsed: boolean;
  usedAt: string | null;
  deviceFingerprint: DeviceFingerprint | null;
  userInfo: {
    name: string;
    campus: string;
    email?: string;
  } | null;
  expiresAt: string;
  description?: string;
}

export interface CurrentUserSession {
  isAuthenticated: boolean;
  userInfo: InviteCodeData['userInfo'] | null;
  role: UserRole;
  deviceFingerprint: DeviceFingerprint | null;
  inviteCode: string | null;
  authenticatedAt: string | null;
}

interface InviteCodeContextType {
  // 当前用户会话
  currentSession: CurrentUserSession;
  
  // 邀请码管理（管理员功能）
  inviteCodes: InviteCodeData[];
  generateInviteCode: (role: UserRole, createdFor: string, description?: string) => Promise<string>;
  revokeInviteCode: (code: string) => Promise<void>;
  unbindDevice: (code: string) => Promise<void>;
  
  // 用户认证
  activateInviteCode: (code: string, userInfo: { name: string; campus: string; email?: string }, updateUserRole?: (role: UserRole) => void) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // 设备验证
  verifyDeviceBinding: () => Promise<boolean>;
  getCurrentDeviceFingerprint: () => Promise<DeviceFingerprint>;
  
  // 数据管理
  refreshData: () => Promise<void>;
  getCodesByRole: (role: UserRole) => InviteCodeData[];
  getUnusedCodes: () => InviteCodeData[];
  getUsedCodes: () => InviteCodeData[];
}

const InviteCodeContext = createContext<InviteCodeContextType | undefined>(undefined);

const INVITE_CODES_STORAGE_KEY = 'invite_codes_data';
const CURRENT_SESSION_STORAGE_KEY = 'current_user_session';
const DEVICE_ID_STORAGE_KEY = 'unique_device_id';

export const InviteCodeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inviteCodes, setInviteCodes] = useState<InviteCodeData[]>([]);
  const [currentSession, setCurrentSession] = useState<CurrentUserSession>({
    isAuthenticated: false,
    userInfo: null,
    role: 'student',
    deviceFingerprint: null,
    inviteCode: null,
    authenticatedAt: null,
  });

  // Load data on mount
  useEffect(() => {
    initializeData();
  }, []);

  // Verify device binding on app start
  useEffect(() => {
    if (currentSession.isAuthenticated) {
      verifyDeviceBinding();
    }
  }, [currentSession.isAuthenticated]);

  const initializeData = async () => {
    try {
      await Promise.all([
        loadInviteCodes(),
        loadCurrentSession(),
      ]);
    } catch (error) {
      console.error('Error initializing invite code data:', error);
    }
  };

  const loadInviteCodes = async () => {
    try {
      const savedCodes = await AsyncStorage.getItem(INVITE_CODES_STORAGE_KEY);
      if (savedCodes) {
        const parsedCodes: InviteCodeData[] = JSON.parse(savedCodes);
        setInviteCodes(parsedCodes);
      } else {
        // Initialize with sample admin codes
        await initializeSampleCodes();
      }
    } catch (error) {
      console.error('Error loading invite codes:', error);
    }
  };

  const loadCurrentSession = async () => {
    try {
      const savedSession = await AsyncStorage.getItem(CURRENT_SESSION_STORAGE_KEY);
      if (savedSession) {
        const parsedSession: CurrentUserSession = JSON.parse(savedSession);
        setCurrentSession(parsedSession);
      }
    } catch (error) {
      console.error('Error loading current session:', error);
    }
  };

  const saveInviteCodes = async (codes: InviteCodeData[]) => {
    try {
      await AsyncStorage.setItem(INVITE_CODES_STORAGE_KEY, JSON.stringify(codes));
      setInviteCodes(codes);
    } catch (error) {
      console.error('Error saving invite codes:', error);
    }
  };

  const saveCurrentSession = async (session: CurrentUserSession) => {
    try {
      await AsyncStorage.setItem(CURRENT_SESSION_STORAGE_KEY, JSON.stringify(session));
      setCurrentSession(session);
    } catch (error) {
      console.error('Error saving current session:', error);
    }
  };

  const generateSecureInviteCode = (role: UserRole): string => {
    const prefix = role === 'admin' ? 'AD' : role === 'core_member' ? 'CM' : 'ST';
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 去除易混淆字符
    
    let code = prefix + '-';
    for (let i = 0; i < 6; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      code += segment + (i < 5 ? '-' : '');
    }
    
    return code;
  };

  const getCurrentDeviceFingerprint = async (): Promise<DeviceFingerprint> => {
    try {
      // 尝试获取或生成唯一设备ID
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      }

      return {
        deviceId,
        brand: Device.brand || 'Unknown',
        model: Device.modelName || 'Unknown',
        systemVersion: Device.osVersion || 'Unknown',
        bundleId: Constants.expoConfig?.slug || 'expo-app',
        installTime: Date.now(),
      };
    } catch (error) {
      console.error('Error getting device fingerprint:', error);
      // Fallback fingerprint
      const fallbackId = 'fallback_' + Math.random().toString(36).substr(2, 9);
      return {
        deviceId: fallbackId,
        brand: 'Unknown',
        model: 'Unknown',
        systemVersion: 'Unknown',
        bundleId: 'unknown',
        installTime: Date.now(),
      };
    }
  };

  const generateInviteCode = async (
    role: UserRole, 
    createdFor: string, 
    description?: string
  ): Promise<string> => {
    const code = generateSecureInviteCode(role);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1年后过期

    const newCodeData: InviteCodeData = {
      code,
      role,
      createdAt: now,
      createdFor,
      isUsed: false,
      usedAt: null,
      deviceFingerprint: null,
      userInfo: null,
      expiresAt,
      description,
    };

    const updatedCodes = [...inviteCodes, newCodeData];
    await saveInviteCodes(updatedCodes);
    
    return code;
  };

  const activateInviteCode = async (
    code: string, 
    userInfo: { name: string; campus: string; email?: string },
    updateUserRole?: (role: UserRole) => void
  ): Promise<boolean> => {
    try {
      const codeData = inviteCodes.find(c => c.code === code);
      
      if (!codeData) {
        throw new Error('Invalid invite code');
      }

      if (codeData.isUsed) {
        throw new Error('Invite code has already been used');
      }

      if (new Date(codeData.expiresAt) < new Date()) {
        throw new Error('Invite code has expired');
      }

      // Get device fingerprint
      const deviceFingerprint = await getCurrentDeviceFingerprint();

      // Update invite code data
      const updatedCodeData: InviteCodeData = {
        ...codeData,
        isUsed: true,
        usedAt: new Date().toISOString(),
        deviceFingerprint,
        userInfo,
      };

      const updatedCodes = inviteCodes.map(c => 
        c.code === code ? updatedCodeData : c
      );
      await saveInviteCodes(updatedCodes);

      // Create user session
      const newSession: CurrentUserSession = {
        isAuthenticated: true,
        userInfo,
        role: codeData.role,
        deviceFingerprint,
        inviteCode: code,
        authenticatedAt: new Date().toISOString(),
      };
      await saveCurrentSession(newSession);

      // 🔥 CRITICAL FIX: Update the UserRoleContext as well
      if (updateUserRole) {
        updateUserRole(codeData.role);
      }

      return true;
    } catch (error) {
      console.error('Error activating invite code:', error);
      throw error;
    }
  };

  const verifyDeviceBinding = async (): Promise<boolean> => {
    try {
      if (!currentSession.isAuthenticated || !currentSession.deviceFingerprint) {
        return false;
      }

      const currentFingerprint = await getCurrentDeviceFingerprint();
      const savedFingerprint = currentSession.deviceFingerprint;

      // Check critical device identifiers
      const isValidDevice = 
        currentFingerprint.deviceId === savedFingerprint.deviceId &&
        currentFingerprint.bundleId === savedFingerprint.bundleId;

      if (!isValidDevice) {
        // Device mismatch - logout user
        await logout();
        throw new Error('Device verification failed. Please contact administrator.');
      }

      return true;
    } catch (error) {
      console.error('Error verifying device binding:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const emptySession: CurrentUserSession = {
        isAuthenticated: false,
        userInfo: null,
        role: 'student',
        deviceFingerprint: null,
        inviteCode: null,
        authenticatedAt: null,
      };
      await saveCurrentSession(emptySession);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const revokeInviteCode = async (code: string): Promise<void> => {
    const updatedCodes = inviteCodes.filter(c => c.code !== code);
    await saveInviteCodes(updatedCodes);
  };

  const unbindDevice = async (code: string): Promise<void> => {
    const updatedCodes = inviteCodes.map(c => 
      c.code === code 
        ? { ...c, isUsed: false, usedAt: null, deviceFingerprint: null, userInfo: null }
        : c
    );
    await saveInviteCodes(updatedCodes);

    // If this is the current user's code, logout
    if (currentSession.inviteCode === code) {
      await logout();
    }
  };

  const refreshData = async (): Promise<void> => {
    await initializeData();
  };

  const getCodesByRole = (role: UserRole): InviteCodeData[] => {
    return inviteCodes.filter(code => code.role === role);
  };

  const getUnusedCodes = (): InviteCodeData[] => {
    return inviteCodes.filter(code => 
      !code.isUsed && new Date(code.expiresAt) > new Date()
    );
  };

  const getUsedCodes = (): InviteCodeData[] => {
    return inviteCodes.filter(code => code.isUsed);
  };

  const initializeSampleCodes = async () => {
    const sampleCodes: InviteCodeData[] = [
      {
        code: 'AD-2025-X7Y9-P2Q4-M8K3-N6R7-J1L9-F4V8',
        role: 'admin',
        createdAt: '2025-08-20T10:00:00Z',
        createdFor: 'Campus Ministry Leader',
        isUsed: false,
        usedAt: null,
        deviceFingerprint: null,
        userInfo: null,
        expiresAt: '2026-08-20T10:00:00Z',
        description: 'Primary admin access for campus ministry leader',
      },
      {
        code: 'CM-2025-K7P9-W2X5-M8Q3-N6R4-J1L7-F9V2',
        role: 'core_member',
        createdAt: '2025-08-20T10:15:00Z',
        createdFor: 'John Smith',
        isUsed: false,
        usedAt: null,
        deviceFingerprint: null,
        userInfo: null,
        expiresAt: '2026-08-20T10:15:00Z',
        description: 'Bible study leader access',
      },
      {
        code: 'CM-2025-B3H8-T6Y4-R9P1-G7K2-V5M9-C8N4',
        role: 'core_member',
        createdAt: '2025-08-20T10:30:00Z',
        createdFor: 'Sarah Chen',
        isUsed: false,
        usedAt: null,
        deviceFingerprint: null,
        userInfo: null,
        expiresAt: '2026-08-20T10:30:00Z',
        description: 'Fellowship coordinator access',
      },
    ];

    await saveInviteCodes(sampleCodes);
  };

  return (
    <InviteCodeContext.Provider value={{
      currentSession,
      inviteCodes,
      generateInviteCode,
      revokeInviteCode,
      unbindDevice,
      activateInviteCode,
      logout,
      verifyDeviceBinding,
      getCurrentDeviceFingerprint,
      refreshData,
      getCodesByRole,
      getUnusedCodes,
      getUsedCodes,
    }}>
      {children}
    </InviteCodeContext.Provider>
  );
};

export const useInviteCode = (): InviteCodeContextType => {
  const context = useContext(InviteCodeContext);
  if (!context) {
    throw new Error('useInviteCode must be used within an InviteCodeProvider');
  }
  return context;
};