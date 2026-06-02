import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const SavedBoutiquesScreen = lazyScreen(() => import('@/screens/SavedBoutiquesScreen'));

export default function SavedBoutiquesRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/saved-boutiques">
      <SavedBoutiquesScreen />
    </ProtectedRouteGate>
  );
}
