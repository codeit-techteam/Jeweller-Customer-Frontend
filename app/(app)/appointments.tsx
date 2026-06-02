import AppointmentsScreen from '@/screens/AppointmentsScreen';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';

export default function AppointmentsRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/appointments">
      <AppointmentsScreen />
    </ProtectedRouteGate>
  );
}
