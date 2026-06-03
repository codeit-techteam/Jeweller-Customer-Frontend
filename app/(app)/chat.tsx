import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { lazyScreen } from '@/lib/utils/lazyScreen';

const ChatScreen = lazyScreen(() => import('@/screens/ChatScreen'));

export default function ChatRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/chat">
      <ChatScreen />
    </ProtectedRouteGate>
  );
}
