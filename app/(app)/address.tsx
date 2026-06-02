import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const AddressScreen = lazyScreen(() => import('@/screens/AddressScreen'));

export default function AddressRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/address">
      <AddressScreen />
    </ProtectedRouteGate>
  );
}
