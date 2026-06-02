import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const OrdersScreen = lazyScreen(() => import('@/screens/OrdersScreen'));

export default function OrdersRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/orders">
      <OrdersScreen />
    </ProtectedRouteGate>
  );
}
