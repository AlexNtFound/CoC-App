// contexts/UserContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  campus: string;
  year: string;
  joinDate: string;
  eventsAttended: number;
  studiesCompleted: number;
  prayerRequestsSubmitted: number;
  bio?: string;
  phone?: string;
  profileImage?: string;
}

interface UserContextType {
  user: UserProfile;
  updateUser: (userData: Partial<UserProfile>) => void;
  setUser: (userData: UserProfile) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Default user data
const defaultUser: UserProfile = {
  name: 'Anonymous Whale',
  email: 'anonymous.whale@university.edu',
  campus: 'University of California',
  year: 'Freshman',
  joinDate: 'September 2023',
  eventsAttended: 15,
  studiesCompleted: 8,
  prayerRequestsSubmitted: 3,
  bio: '',
  phone: '',
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile>(defaultUser);

  const updateUser = (userData: Partial<UserProfile>) => {
    setUserState(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  const setUser = (userData: UserProfile) => {
    setUserState(userData);
  };

  return (
    <UserContext.Provider value={{ user, updateUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};