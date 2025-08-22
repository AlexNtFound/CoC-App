// CoC-App/contexts/UserManagementContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { UserRole } from './UserRoleContext';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  campus: string;
  role: UserRole;
  joinDate: string;
  lastActive: string;
  isActive: boolean;
}

interface UserManagementContextType {
  users: ManagedUser[];
  currentUserId: string;
  addUser: (userData: Omit<ManagedUser, 'id' | 'joinDate' | 'lastActive' | 'isActive'>) => Promise<string>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  reactivateUser: (userId: string) => Promise<void>;
  searchUsers: (query: string) => ManagedUser[];
  getUsersByRole: (role: UserRole) => ManagedUser[];
  refreshUsers: () => Promise<void>;
  setCurrentUserId: (userId: string) => void;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'managed_users';
const CURRENT_USER_ID_KEY = 'current_user_id';

export const UserManagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<string>('');

  // Load data on mount
  useEffect(() => {
    loadUsers();
    loadCurrentUserId();
  }, []);

  const loadUsers = async () => {
    try {
      const savedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (savedUsers) {
        const parsedUsers: ManagedUser[] = JSON.parse(savedUsers);
        setUsers(parsedUsers);
      } else {
        // Initialize with sample admin user
        await initializeSampleUsers();
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCurrentUserId = async () => {
    try {
      const savedUserId = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
      if (savedUserId) {
        setCurrentUserIdState(savedUserId);
      } else {
        // Default to first admin user
        const adminUser = users.find(u => u.role === 'admin');
        if (adminUser) {
          setCurrentUserId(adminUser.id);
        }
      }
    } catch (error) {
      console.error('Error loading current user ID:', error);
    }
  };

  const saveUsers = async (newUsers: ManagedUser[]) => {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
      setUsers(newUsers);
    } catch (error) {
      console.error('Error saving users:', error);
    }
  };

  const setCurrentUserId = async (userId: string) => {
    try {
      await AsyncStorage.setItem(CURRENT_USER_ID_KEY, userId);
      setCurrentUserIdState(userId);
    } catch (error) {
      console.error('Error saving current user ID:', error);
    }
  };

  const generateUserId = (): string => {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const addUser = async (userData: Omit<ManagedUser, 'id' | 'joinDate' | 'lastActive' | 'isActive'>): Promise<string> => {
    // Check if email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser: ManagedUser = {
      ...userData,
      id: generateUserId(),
      joinDate: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isActive: true,
    };

    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
    
    return newUser.id;
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, role: newRole, lastActive: new Date().toISOString() }
        : user
    );
    
    await saveUsers(updatedUsers);
  };

  const deactivateUser = async (userId: string): Promise<void> => {
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, isActive: false, lastActive: new Date().toISOString() }
        : user
    );
    
    await saveUsers(updatedUsers);
  };

  const reactivateUser = async (userId: string): Promise<void> => {
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, isActive: true, lastActive: new Date().toISOString() }
        : user
    );
    
    await saveUsers(updatedUsers);
  };

  const searchUsers = (query: string): ManagedUser[] => {
    if (!query.trim()) return users;
    
    const lowercaseQuery = query.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.campus.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getUsersByRole = (role: UserRole): ManagedUser[] => {
    return users.filter(user => user.role === role && user.isActive);
  };

  const refreshUsers = async () => {
    await loadUsers();
  };

  const initializeSampleUsers = async () => {
    const sampleUsers: ManagedUser[] = [
      {
        id: 'admin_001',
        name: 'Campus Ministry Leader',
        email: 'admin@campus.org',
        campus: 'University of California',
        role: 'admin',
        joinDate: '2023-09-01T00:00:00Z',
        lastActive: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'core_001',
        name: 'John Smith',
        email: 'john.smith@student.edu',
        campus: 'University of California',
        role: 'core_member',
        joinDate: '2023-10-15T00:00:00Z',
        lastActive: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'student_001',
        name: 'Mary Johnson',
        email: 'mary.johnson@student.edu',
        campus: 'University of California',
        role: 'student',
        joinDate: '2024-01-20T00:00:00Z',
        lastActive: new Date().toISOString(),
        isActive: true,
      },
    ];

    await saveUsers(sampleUsers);
    setCurrentUserId('admin_001'); // Set admin as default current user
  };

  return (
    <UserManagementContext.Provider value={{
      users,
      currentUserId,
      addUser,
      updateUserRole,
      deactivateUser,
      reactivateUser,
      searchUsers,
      getUsersByRole,
      refreshUsers,
      setCurrentUserId,
    }}>
      {children}
    </UserManagementContext.Provider>
  );
};

export const useUserManagement = (): UserManagementContextType => {
  const context = useContext(UserManagementContext);
  if (!context) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }
  return context;
};