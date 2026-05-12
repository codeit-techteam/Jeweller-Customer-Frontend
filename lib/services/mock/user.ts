export type MembershipTier = 'gold' | 'silver' | 'platinum';

export type MockUser = {
  name: string;
  phone: string;
  /** Display label e.g. "GOLD MEMBER" */
  membership: string;
  membershipTier: MembershipTier;
  /** Remote image URL for profile avatar */
  avatar: string;
  /** Unread notifications count (menu badge) */
  notificationBadgeCount: number;
};

export const mockUser: MockUser = {
  name: 'Aditi Sharma',
  phone: '+91 98765 43210',
  membership: 'GOLD MEMBER',
  membershipTier: 'gold',
  avatar:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80',
  notificationBadgeCount: 3,
};
