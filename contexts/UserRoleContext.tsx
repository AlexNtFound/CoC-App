// CoC-App/contexts/UserRoleContext.tsx
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
  updateUserRole: (role: UserRole) => void;
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

export const UserRoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRoleProfile>({
    role: 'student',
    permissions: getRolePermissions('student'),
  });

  // Load role from storage on mount
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
        if (savedRole && ['student', 'core_member', 'admin'].includes(savedRole)) {
          const role = savedRole as UserRole;
          setUserRole({
            role,
            permissions: getRolePermissions(role),
          });
        }
      } catch (error) {
        console.error('Error loading user role:', error);
      }
    };
    loadUserRole();
  }, []);

  const updateUserRole = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
      setUserRole({
        role,
        permissions: getRolePermissions(role),
      });
    } catch (error) {
      console.error('Error saving user role:', error);
    }
  };

  const isCoreMember = userRole.role === 'core_member' || userRole.role === 'admin';
  const isAdmin = userRole.role === 'admin';
  const canCreateEvents = userRole.permissions.canCreateEvents;

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