// CoC-App/hooks/useRoleSync.ts - Fixed version with better debugging
import { useEffect } from 'react';
import { useInviteCode } from '../contexts/InviteCodeContext';
import { useUserRole } from '../contexts/UserRoleContext';

/**
 * Hook to keep UserRoleContext in sync with InviteCodeContext
 * This ensures that when a user activates an invite code or logs out,
 * their role is properly reflected throughout the app
 */
export const useRoleSync = () => {
  const { currentSession } = useInviteCode();
  const { userRole, updateUserRole } = useUserRole();

  useEffect(() => {
    // Only sync if the roles are actually different
    const shouldSync = currentSession.isAuthenticated 
      ? currentSession.role !== userRole.role 
      : userRole.role !== 'student';

    if (shouldSync) {
      console.log('🔄 Role sync triggered:', {
        isAuthenticated: currentSession.isAuthenticated,
        inviteCodeRole: currentSession.role,
        currentUserRole: userRole.role,
        shouldSync
      });

      if (currentSession.isAuthenticated && currentSession.role) {
        // User is authenticated with invite code, sync their role
        console.log(`🔄 Syncing role to: ${currentSession.role}`);
        updateUserRole(currentSession.role);
      } else {
        // User is not authenticated, set role to student
        console.log('🔄 Syncing role to: student (not authenticated)');
        updateUserRole('student');
      }
    }
  }, [currentSession.isAuthenticated, currentSession.role, userRole.role, updateUserRole]);

  // Return current sync status for debugging
  return {
    isInSync: currentSession.isAuthenticated 
      ? currentSession.role === userRole.role 
      : userRole.role === 'student',
    inviteCodeRole: currentSession.role,
    userRole: userRole.role,
    isAuthenticated: currentSession.isAuthenticated
  };
};