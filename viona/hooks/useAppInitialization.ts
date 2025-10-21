// File: hooks/useAppInitialization.ts
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useOrgStore } from '@/hooks/useOrgStore';
import { getUserOrganizations } from '@/app/organization/actions';

export function useAppInitialization() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { 
    user: appUser, 
    setUser, 
    orgs, 
    setOrgs, 
    validateSelectedOrg, 
    clearStore,
    isValidSession,
    switchUser
  } = useOrgStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Handle user authentication state changes
  useEffect(() => {
    if (!clerkLoaded) return;

    const currentUserId = clerkUser?.id || null;
    const currentUserEmail = clerkUser?.primaryEmailAddress?.emailAddress || '';

    // User logged out
    if (!clerkUser && appUser) {
      console.log('useAppInitialization: User logged out, clearing all data');
      clearStore();
      setIsInitialized(false);
      setIsInitializing(false);
      setInitError(null);
      setLastUserId(null);
      return;
    }

    // User logged in
    if (clerkUser && currentUserId && currentUserEmail) {
      const currentUserData = {
        id: currentUserId,
        email: currentUserEmail,
      };

      // Check if this is a different user
      if (lastUserId && lastUserId !== currentUserId) {
        console.log(`useAppInitialization: User changed from ${lastUserId} to ${currentUserId}`);
        // Clear previous user's data and reset initialization state
        switchUser(currentUserData);
        setIsInitialized(false);
        setIsInitializing(false);
        setInitError(null);
        setLastUserId(currentUserId);
        return;
      }

      // Check if stored session is valid
      if (appUser && !isValidSession(currentUserId)) {
        console.log('useAppInitialization: Invalid session detected, clearing data');
        switchUser(currentUserData);
        setIsInitialized(false);
        setIsInitializing(false);
        setInitError(null);
        setLastUserId(currentUserId);
        return;
      }

      // Set user if not already set or if it's the first time
      if (!appUser) {
        console.log('useAppInitialization: Setting user from Clerk:', currentUserId);
        setUser(currentUserData);
        setLastUserId(currentUserId);
      }
    }
  }, [clerkUser, clerkLoaded, appUser, setUser, clearStore, isValidSession, switchUser, lastUserId]);

  // Load organizations when user is available and session is valid
  useEffect(() => {
    const initializeOrganizations = async () => {
      // Don't initialize if:
      // - Clerk is not loaded
      // - No user logged in
      // - Already initialized
      // - Already initializing
      // - Session is invalid
      if (!clerkLoaded || 
          !clerkUser?.id || 
          !appUser?.id || 
          isInitialized || 
          isInitializing ||
          !isValidSession(clerkUser.id)) {
        return;
      }

      // If organizations are already loaded for this user, mark as initialized
      if (orgs.length > 0) {
        console.log('useAppInitialization: Organizations already loaded, marking as initialized');
        setIsInitialized(true);
        return;
      }

      setIsInitializing(true);
      setInitError(null);

      try {
        console.log('useAppInitialization: Loading organizations for user:', appUser.id);
        const userOrgs = await getUserOrganizations();
        
        // Double-check session is still valid before setting data
        if (!isValidSession(clerkUser.id)) {
          console.log('useAppInitialization: Session became invalid during loading');
          setIsInitializing(false);
          return;
        }
        
        console.log('useAppInitialization: Loaded organizations:', userOrgs);
        setOrgs(userOrgs);
        
        // Validate and potentially auto-select organization
        validateSelectedOrg();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('useAppInitialization: Failed to load organizations:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load organizations';
        setInitError(errorMessage);
        
        // Mark as initialized to prevent infinite retries, but with error state
        setIsInitialized(true);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeOrganizations();
  }, [
    clerkLoaded, 
    clerkUser?.id, 
    appUser?.id, 
    isInitialized, 
    isInitializing, 
    orgs.length, 
    setOrgs, 
    validateSelectedOrg, 
    isValidSession
  ]);

  // Reset initialization when user changes
  useEffect(() => {
    if (clerkUser?.id && lastUserId && lastUserId !== clerkUser.id) {
      setIsInitialized(false);
      setIsInitializing(false);
      setInitError(null);
    }
  }, [clerkUser?.id, lastUserId]);

  // Helper to manually refresh organizations
  const refreshOrganizations = async () => {
    if (!clerkUser?.id || !appUser?.id || !isValidSession(clerkUser.id)) {
      console.log('useAppInitialization: Cannot refresh - invalid session');
      return false;
    }

    setIsInitializing(true);
    setInitError(null);

    try {
      console.log('useAppInitialization: Manually refreshing organizations');
      const userOrgs = await getUserOrganizations();
      setOrgs(userOrgs);
      validateSelectedOrg();
      return true;
    } catch (error) {
      console.error('useAppInitialization: Failed to refresh organizations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh organizations';
      setInitError(errorMessage);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    // Initialization state
    isInitialized: isInitialized || (orgs.length > 0 && !!appUser),
    isInitializing,
    initError,
    
    // User data
    appUser,
    
    // Helper functions
    refreshOrganizations,
    
    // Session validation
    isValidSession: appUser ? isValidSession(appUser.id) : false,
  };
}
