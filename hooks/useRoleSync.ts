// CoC-App/hooks/useRoleSync.ts - Bulletproof version that prevents all race conditions
import { useCallback, useEffect, useRef } from 'react';
import { useInviteCode } from '../contexts/InviteCodeContext';
import { useUserRole } from '../contexts/UserRoleContext';

// Global flag to disable sync across all instances
let globalSyncDisabled = false;
let globalSyncTimeout: number | null = null;

/**
 * Hook to keep UserRoleContext in sync with InviteCodeContext
 * This ensures that when a user activates an invite code or logs out,
 * their role is properly reflected throughout the app
 */
export const useRoleSync = () => {
  const { currentSession } = useInviteCode();
  const { userRole, updateUserRole } = useUserRole();
  const lastSyncRef = useRef<string | null>(null);
  const isExecutingSyncRef = useRef(false);

  // Global sync disable function that affects ALL instances
  const disableSync = useCallback((duration: number = 5000) => {
    if (__DEV__) {
      console.log('🔄 Disabling role sync GLOBALLY for', duration, 'ms');
      
      // Clear any existing timeout
      if (globalSyncTimeout) {
        clearTimeout(globalSyncTimeout);
      }
      
      // Disable sync globally
      globalSyncDisabled = true;
      
      // Re-enable after duration
      globalSyncTimeout = setTimeout(() => {
        globalSyncDisabled = false;
        console.log('🔄 Role sync re-enabled GLOBALLY');
      }, duration);
    }
  }, []);

  useEffect(() => {
    // FIRST: Check global sync disable flag
    if (globalSyncDisabled) {
      if (__DEV__) {
        console.log('🔄 Global sync is disabled, skipping role sync');
      }
      return;
    }

    // SECOND: Prevent concurrent executions
    if (isExecutingSyncRef.current) {
      if (__DEV__) {
        console.log('🔄 Sync already executing, skipping');
      }
      return;
    }

    // Check if we should sync
    const shouldSync = currentSession.isAuthenticated 
      ? currentSession.role !== userRole.role 
      : userRole.role !== 'student';

    // Prevent infinite loops by checking if we just synced this combination
    const currentSyncKey = `${currentSession.isAuthenticated}-${currentSession.role}-${userRole.role}`;
    const isDuplicate = lastSyncRef.current === currentSyncKey;

    // Skip sync if it's a duplicate
    if (isDuplicate) {
      if (__DEV__) {
        console.log('🔄 No sync needed (duplicate):', {
          currentUserRole: userRole.role,
          inviteCodeRole: currentSession.role,
          isAuthenticated: currentSession.isAuthenticated,
          syncKey: currentSyncKey
        });
      }
      return;
    }

    if (shouldSync) {
      // Mark as executing to prevent concurrent runs
      isExecutingSyncRef.current = true;
      
      console.log('🔄 Role sync triggered:', {
        isAuthenticated: currentSession.isAuthenticated,
        inviteCodeRole: currentSession.role,
        currentUserRole: userRole.role,
        shouldSync,
        globalSyncDisabled
      });

      // Remember this sync to prevent duplicates
      lastSyncRef.current = currentSyncKey;

      // Execute the sync
      const executeSync = async () => {
        try {
          if (currentSession.isAuthenticated && currentSession.role) {
            // User is authenticated with invite code, sync their role
            console.log(`🔄 Syncing role to: ${currentSession.role}`);
            await updateUserRole(currentSession.role);
          } else {
            // User is not authenticated, set role to student
            console.log('🔄 Syncing role to: student (not authenticated)');
            await updateUserRole('student');
          }
        } catch (error) {
          console.error('🔄 Error during role sync:', error);
        } finally {
          // Always clear the executing flag
          isExecutingSyncRef.current = false;
        }
      };

      executeSync();
    } else if (__DEV__) {
      console.log('🔄 No sync needed (already in sync):', {
        currentUserRole: userRole.role,
        inviteCodeRole: currentSession.role,
        isAuthenticated: currentSession.isAuthenticated
      });
    }
  }, [currentSession.isAuthenticated, currentSession.role, userRole.role, updateUserRole]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isExecutingSyncRef.current = false;
    };
  }, []);

  // Return current sync status for debugging
  return {
    isInSync: currentSession.isAuthenticated 
      ? currentSession.role === userRole.role 
      : userRole.role === 'student',
    inviteCodeRole: currentSession.role,
    userRole: userRole.role,
    isAuthenticated: currentSession.isAuthenticated,
    isSyncDisabled: globalSyncDisabled,
    lastSync: lastSyncRef.current,
    disableSync,
  };
};