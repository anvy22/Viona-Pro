// File: components/AppInitializer.tsx
"use client";

import { ReactNode } from 'react';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { Loader2 } from 'lucide-react';

interface AppInitializerProps {
  children: ReactNode;
  showLoadingScreen?: boolean;
}

export function AppInitializer({ children, showLoadingScreen = true }: AppInitializerProps) {
  const { isInitialized, isInitializing, appUser } = useAppInitialization();

  // Show loading screen only if user is logged in but not initialized
  if (appUser && !isInitialized && isInitializing && showLoadingScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Setting up your workspace</h2>
            <p className="text-sm text-muted-foreground">
              Loading your organizations and preferences...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
