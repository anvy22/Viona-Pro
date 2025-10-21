// File: hooks/useOrgStore.ts
// Global Zustand store for user, organizations, and selected organization

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Org = {
  id: string;
  name: string;
  role: string;
};

type UserDetails = {
  id: string; // clerk_id
  email: string;
} | null;

type Store = {
  user: UserDetails;
  setUser: (user: UserDetails) => void;
  orgs: Org[];
  setOrgs: (orgs: Org[]) => void;
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  // Session management methods
  validateSelectedOrg: () => void;
  clearStore: () => void;
  isValidSession: (currentUserId: string) => boolean;
  switchUser: (newUser: UserDetails) => void;
};

export const useOrgStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      orgs: [],
      selectedOrgId: null,

      setUser: (user) => {
        const currentState = get();
        
        // Check if this is a different user
        if (currentState.user && user && currentState.user.id !== user.id) {
          console.log(`User changed from ${currentState.user.id} to ${user.id}, clearing organization data`);
          // Clear organization data but keep the new user
          set({
            user,
            orgs: [],
            selectedOrgId: null,
          });
        } else if (!user && currentState.user) {
          // User logged out
          console.log(`User ${currentState.user.id} logged out, clearing all data`);
          get().clearStore();
        } else {
          // Same user or initial login
          set({ user });
        }
      },

      setOrgs: (orgs) => {
        const currentState = get();
        
        // Only set orgs if we have a valid user session
        if (currentState.user) {
          set({ orgs });
          // Validate selectedOrgId when orgs are updated
          get().validateSelectedOrg();
        } else {
          console.log('Cannot set organizations without a valid user session');
        }
      },

      setSelectedOrgId: (id) => {
        const currentState = get();
        
        // Only set selectedOrgId if we have a valid user session
        if (currentState.user) {
          set({ selectedOrgId: id });
        } else {
          console.log('Cannot select organization without a valid user session');
        }
      },

      // Switch to a different user (clears all data and sets new user)
      switchUser: (newUser) => {
        console.log(`Switching to user: ${newUser?.id || 'null'}`);
        set({
          user: newUser,
          orgs: [],
          selectedOrgId: null,
        });
      },

      // Check if current session belongs to the specified user
      isValidSession: (currentUserId) => {
        const currentState = get();
        const isValid = currentState.user?.id === currentUserId;
        
        if (!isValid && currentState.user) {
          console.log(`Session mismatch: stored user ${currentState.user.id} vs current user ${currentUserId}`);
        }
        
        return isValid;
      },
      
      // Validate that selectedOrgId exists in current orgs
      validateSelectedOrg: () => {
        const { selectedOrgId, orgs, user } = get();
        
        // Only validate if we have a user
        if (!user) {
          set({ selectedOrgId: null });
          return;
        }

        if (selectedOrgId && orgs.length > 0) {
          const isValidOrg = orgs.some(org => org.id === selectedOrgId);
          if (!isValidOrg) {
            console.log(`Invalid org ID ${selectedOrgId}, resetting to first available org`);
            set({ selectedOrgId: orgs[0]?.id || null });
          }
        } else if (orgs.length > 0 && !selectedOrgId) {
          // Auto-select first organization if none selected
          console.log(`Auto-selecting first org: ${orgs[0].id}`);
          set({ selectedOrgId: orgs[0].id });
        } else if (orgs.length === 0 && selectedOrgId) {
          // No orgs available, clear selection
          console.log('No organizations available, clearing selection');
          set({ selectedOrgId: null });
        }
      },

      // Clear all state (useful for logout)
      clearStore: () => {
        console.log('Clearing organization store');
        set({
          user: null,
          orgs: [],
          selectedOrgId: null,
        });
      },
    }),
    { 
      name: 'org-storage',
      version: 3, // Increment to force clear old data with session issues
      
      // Custom storage to add session validation
      partialize: (state) => {
        // Only persist essential data
        return {
          user: state.user,
          selectedOrgId: state.selectedOrgId,
          // Don't persist orgs - they should be loaded fresh for each session
        };
      },
      
      // Add migration logic for version changes
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          // Clear old data that might have session issues
          console.log('Migrating org store to version 3, clearing data');
          return {
            user: null,
            orgs: [],
            selectedOrgId: null,
          };
        }
        return persistedState;
      },
    }
  )
);

// Export helper hooks for common operations
export const useCurrentUser = () => useOrgStore((state) => state.user);
export const useOrganizations = () => useOrgStore((state) => state.orgs);
export const useSelectedOrg = () => useOrgStore((state) => state.selectedOrgId);
