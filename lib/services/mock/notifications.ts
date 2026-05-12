import {
  boutiqueListingCoverImage,
  COLLECTION_HERO_URIS,
  RING_CATEGORY_ANCHOR,
} from '@/lib/services/mock/imageUrls';

export type NotificationIconType = 'package' | 'calendar' | 'sparkles' | 'price';

export type NotificationGroup = 'today' | 'earlier';

export type NotificationModel = {
  id: string;
  title: string;
  message: string;
  time: string;
  group: NotificationGroup;
  isRead: boolean;
  iconType: NotificationIconType;
  /** Optional primary action (e.g. Track Order) */
  action?: { label: string };
  /** Optional hero strip */
  imageUri?: string;
  /** Legacy tint strip (used when no imageUri) */
  imageTint?: string;
};

/** Default list from design (non-empty) */
export const notificationsMock: NotificationModel[] = [
  {
    id: 'n1',
    title: 'Order Shipped',
    message:
      'Your diamond solitaire necklace has been dispatched and is on its way to you.',
    time: '2h ago',
    group: 'today',
    isRead: false,
    iconType: 'package',
    action: { label: 'Track Order' },
    imageUri: RING_CATEGORY_ANCHOR,
  },
  {
    id: 'n2',
    title: 'Appointment Reminder',
    message:
      'Your personalized consultation at our Flagship Store is scheduled for tomorrow at 4:00 PM.',
    time: '5h ago',
    group: 'today',
    isRead: false,
    iconType: 'calendar',
    imageUri: boutiqueListingCoverImage('shyam-boutique'),
  },
  {
    id: 'n3',
    title: 'New Bridal Collection',
    message:
      "Experience 'The Eternal Glow'—our latest collection crafted for the modern bride.",
    time: 'Yesterday',
    group: 'earlier',
    isRead: true,
    iconType: 'sparkles',
    imageUri: COLLECTION_HERO_URIS.wedding,
  },
  {
    id: 'n4',
    title: 'Exclusive Anniversary Offer',
    message:
      'Enjoy a 15% discount on all gold jewellery as a token of our appreciation.',
    time: '2 days ago',
    group: 'earlier',
    isRead: true,
    iconType: 'price',
    imageUri: COLLECTION_HERO_URIS.anniversary,
  },
];

/** Use with `useState(notificationsEmpty)` to verify empty UI */
export const notificationsEmpty: NotificationModel[] = [];
