import OrdersScreen from '@/screens/OrdersScreen';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';

export default function OrdersRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/orders">
      <OrdersScreen />
    </ProtectedRouteGate>
  );
}
