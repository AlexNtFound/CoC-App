// CoC-App/contexts/UserRoleContext.tsx - Final fix with proper async handling
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type UserRole = 'student' | 'core_member' | 'admin';

export interface UserRoleProfile {
  role: UserRole;
  permissions: {
    canCreateEvents: boolean;
    canEditAllEvents: boolean;
    canDeleteAllEvents: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
  };
}

interface UserRoleContextType {
  userRole: UserRoleProfile;
  updateUserRole: (role: UserRole) => Promise<void>; // 🔥 Make it async
  isCoreMember: boolean;
  isAdmin: boolean;
  canCreateEvents: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'user_role';

// Default role permissions
const getRolePermissions = (role: UserRole): UserRoleProfile['permissions'] => {
  switch (role) {
    case 'admin':
      return {
        canCreateEvents: true,
        canEditAllEvents: true,
        canDeleteAllEvents: true,
        canManageUsers: true,
        canViewAnalytics: true,
      };
    case 'core_member':
      return {
        canCreateEvents: true,
        canEditAllEvents: false,
        canDeleteAllEvents: false,
        canManageUsers: false,
        canViewAnalytics: true,
      };
    case 'student':
    default:
      return {
        canCreateEvents: false,
        canEditAllEvents: false,
        canDeleteAllEvents: false,
        canManageUsers: false,
        canViewAnalytics: false,
      };
  }
};

const createRoleProfile = (role: UserRole): UserRoleProfile => ({
  role,
  permissions: getRolePermissions(role),
});

export const UserRoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRoleProfile>(createRoleProfile('student'));
  const [isLoading, setIsLoading] = useState(true);

  // Load role from storage on mount
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        console.log('🔧 Loading role from storage...');
        const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
        console.log('🔧 Loaded role from storage:', savedRole);
        
        if (savedRole && ['student', 'core_member', 'admin'].includes(savedRole)) {
          const role = savedRole as UserRole;
          const newRoleProfile = createRoleProfile(role);
          console.log('🔧 Setting loaded role profile:', newRoleProfile);
          setUserRole(newRoleProfile);
        } else {
          // Set default role if none exists
          console.log('🔧 No valid role found, setting default student role');
          const defaultRole = createRoleProfile('student');
          setUserRole(defaultRole);
          await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'student');
        }
      } catch (error) {
        console.error('🔧 Error loading user role:', error);
        // Fallback to student role
        setUserRole(createRoleProfile('student'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserRole();
  }, []);

  const updateUserRole = async (role: UserRole): Promise<void> => {
    try {
      console.log('🔧 updateUserRole called with:', role);
      console.log('🔧 Current userRole state before update:', userRole);
      
      // Validate role
      if (!['student', 'core_member', 'admin'].includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
      
      // Save to storage first and wait for completion
      console.log('🔧 Saving role to AsyncStorage...');
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
      
      // Verify it was saved
      const verifyStored = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      console.log('🔧 Verified stored role:', verifyStored);
      
      if (verifyStored !== role) {
        throw new Error(`Failed to save role to storage. Expected: ${role}, Got: ${verifyStored}`);
      }
      
      // Create new role profile
      const newRoleProfile = createRoleProfile(role);
      console.log('🔧 Creating new role profile:', newRoleProfile);
      
      // Update state
      setUserRole(newRoleProfile);
      console.log('🔧 Role update completed successfully for:', role);
      
      // Additional verification after state update
      setTimeout(async () => {
        const finalVerification = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
        console.log('🔧 Final verification - stored role:', finalVerification);
      }, 100);
      
    } catch (error) {
      console.error('🔧 Error in updateUserRole:', error);
      throw error; // Re-throw to let caller handle
    }
  };

  // Log current role whenever it changes
  useEffect(() => {
    if (!isLoading) {
      console.log('🔧 UserRole state changed:', {
        role: userRole.role,
        permissions: userRole.permissions,
        canCreateEvents: userRole.permissions.canCreateEvents,
        isAdmin: userRole.role === 'admin'
      });
    }
  }, [userRole, isLoading]);

  const isCoreMember = userRole.role === 'core_member' || userRole.role === 'admin';
  const isAdmin = userRole.role === 'admin';
  const canCreateEvents = userRole.permissions.canCreateEvents;

  // Don't render children until initial load is complete
  if (isLoading) {
    console.log('🔧 UserRoleProvider still loading...');
    return null;
  }

  console.log('🔧 UserRoleProvider render:', {
    role: userRole.role,
    canCreateEvents,
    isAdmin,
    isCoreMember
  });

  return (
    <UserRoleContext.Provider value={{
      userRole,
      updateUserRole,
      isCoreMember,
      isAdmin,
      canCreateEvents,
    }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};