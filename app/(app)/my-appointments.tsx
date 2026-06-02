import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const AppointmentsScreen = lazyScreen(() => import('@/screens/AppointmentsScreen'));

export default function MyAppointmentsRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/my-appointments">
      <AppointmentsScreen />
    </ProtectedRouteGate>
  );
}
