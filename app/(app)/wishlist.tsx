import WishlistScreen from '@/screens/WishlistScreen';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';

export default function WishlistRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/wishlist">
      <WishlistScreen />
    </ProtectedRouteGate>
  );
}
