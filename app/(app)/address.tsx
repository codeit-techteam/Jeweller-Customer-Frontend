import AddressScreen from '@/screens/AddressScreen';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';

export default function AddressRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/address">
      <AddressScreen />
    </ProtectedRouteGate>
  );
}
