import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const WishlistScreen = lazyScreen(() => import('@/screens/WishlistScreen'));

export default function WishlistRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/wishlist">
      <WishlistScreen />
    </ProtectedRouteGate>
  );
}
