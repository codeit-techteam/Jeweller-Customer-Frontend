import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const SupportHistoryScreen = lazyScreen(() => import('@/screens/SupportHistoryScreen'));

export default function SupportHistoryRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/support-history">
      <SupportHistoryScreen />
    </ProtectedRouteGate>
  );
}
