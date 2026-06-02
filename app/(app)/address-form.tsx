import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const AddressFormScreen = lazyScreen(() => import('@/screens/AddressFormScreen'));

export default function AddressFormRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/address-form">
      <AddressFormScreen />
    </ProtectedRouteGate>
  );
}
