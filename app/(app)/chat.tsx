import { lazyScreen } from '@/lib/utils/lazyScreen';

export default lazyScreen(() => import('@/screens/ChatScreen'));
