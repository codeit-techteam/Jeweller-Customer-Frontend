import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import EditProfileScreen from '@/screens/EditProfileScreen';

export default function EditProfileRoute() {
  const router = useRouter();
  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/profile');
  }, [router]);

  return (
    <ProtectedRouteGate routePath="/(app)/edit-profile">
      <EditProfileScreen onBack={onBack} />
    </ProtectedRouteGate>
  );
}
