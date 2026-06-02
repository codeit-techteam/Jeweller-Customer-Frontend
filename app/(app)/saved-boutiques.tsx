import SavedBoutiquesScreen from '@/screens/SavedBoutiquesScreen';

import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';

export default function SavedBoutiquesRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/saved-boutiques">
      <SavedBoutiquesScreen />
    </ProtectedRouteGate>
  );
}
