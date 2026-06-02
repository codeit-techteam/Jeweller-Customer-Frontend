import AddressFormScreen from '@/screens/AddressFormScreen';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';

export default function AddressFormRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/address-form">
      <AddressFormScreen />
    </ProtectedRouteGate>
  );
}
