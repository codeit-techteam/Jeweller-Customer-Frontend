import NotificationsScreen from '@/screens/NotificationsScreen';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';

export default function NotificationsRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/notifications">
      <NotificationsScreen />
    </ProtectedRouteGate>
  );
}
