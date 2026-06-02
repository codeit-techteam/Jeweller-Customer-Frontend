import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const ActivePlansScreen = lazyScreen(() => import('@/screens/ActivePlansScreen'));

export default function ActivePlansRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/active-plans">
      <ActivePlansScreen />
    </ProtectedRouteGate>
  );
}
