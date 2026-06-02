import ActivePlansScreen from '@/screens/ActivePlansScreen';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';

export default function ActivePlansRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/active-plans">
      <ActivePlansScreen />
    </ProtectedRouteGate>
  );
}
