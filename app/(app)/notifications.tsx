import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const NotificationsScreen = lazyScreen(() => import('@/screens/NotificationsScreen'));

export default function NotificationsRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/notifications">
      <NotificationsScreen />
    </ProtectedRouteGate>
  );
}
