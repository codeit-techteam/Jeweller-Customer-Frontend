import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type ComingSoonPlanId = 'gold_mine' | 'gold_reserve';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export type ComingSoonPlanConfig = {
  id: ComingSoonPlanId;
  icon: IconName;
  title: string;
  description: string;
  features: string[];
  secondaryLabel: 'Maybe Later' | 'Close';
};

export const COMING_SOON_PLANS: Record<ComingSoonPlanId, ComingSoonPlanConfig> = {
  gold_mine: {
    id: 'gold_mine',
    icon: 'savings',
    title: 'Gold Mine is Coming Soon',
    description:
      "We're building a smarter way to grow your jewellery savings with flexible monthly contributions and exclusive member benefits.",
    features: [
      'Monthly Gold Savings',
      'Bonus Gold Benefits',
      'Exclusive Boutique Rewards',
      'Flexible Withdrawals',
    ],
    secondaryLabel: 'Maybe Later',
  },
  gold_reserve: {
    id: 'gold_reserve',
    icon: 'account-balance-wallet',
    title: 'Gold Reserve is Coming Soon',
    description:
      "Reserve gold at today's rates and unlock premium purchasing benefits when the program launches.",
    features: [
      'Lock Gold Prices',
      'Priority Access',
      'Premium Rewards',
      'Special Member Pricing',
    ],
    secondaryLabel: 'Close',
  },
};
