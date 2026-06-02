import { useRouter, usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';

import { FullScreenLoader } from '@/components/loaders';
import { useAuth } from '@/context/AuthContext';
import { useAuthGuardStore } from '@/lib/stores/authGuardStore';
import type { PendingAction } from '@/lib/types/pendingAction';

type ProtectedRouteGateProps = {
  children: React.ReactNode;
  /** Route pathname for pending action restoration after login */
  routePath?: string;
  routeParams?: Record<string, string>;
};

/**
 * Wraps screens that require authentication.
 * Shows login modal instead of redirecting when guest accesses the route.
 */
export function ProtectedRouteGate({
  children,
  routePath,
  routeParams,
}: ProtectedRouteGateProps) {
  const { isAuthenticated, loading } = useAuth();
  const openLoginModal = useAuthGuardStore((s) => s.openLoginModal);
  const router = useRouter();
  const pathname = usePathname();
  const promptedRef = useRef(false);

  useEffect(() => {
    if (loading || isAuthenticated) {
      promptedRef.current = false;
      return;
    }
    if (promptedRef.current) return;
    promptedRef.current = true;

    const pending: PendingAction = {
      type: 'route',
      pathname: routePath ?? pathname,
      params: routeParams,
    };
    openLoginModal(pending);
  }, [loading, isAuthenticated, openLoginModal, pathname, routePath, routeParams]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const timer = setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(app)/home');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return <FullScreenLoader label="Loading..." />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
