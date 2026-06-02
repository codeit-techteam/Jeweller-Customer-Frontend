import AppointmentsScreen from '@/screens/AppointmentsScreen';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';

export default function MyAppointmentsRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/my-appointments">
      <AppointmentsScreen />
    </ProtectedRouteGate>
  );
}
