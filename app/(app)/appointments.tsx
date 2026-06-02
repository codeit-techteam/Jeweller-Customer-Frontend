import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const AppointmentsScreen = lazyScreen(() => import('@/screens/AppointmentsScreen'));

export default function AppointmentsRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/appointments">
      <AppointmentsScreen />
    </ProtectedRouteGate>
  );
}
