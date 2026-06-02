import type { Appointment, AppointmentBadge } from '@/lib/services/mock/appointments';

export function resolveAppointmentBadge(item: Appointment): AppointmentBadge {
  if (item.badge) return item.badge;
  if (item.status === 'cancelled') return 'cancelled';
  if (item.status === 'completed') return 'completed';
  if (item.status === 'upcoming' && item.startsAt) {
    const t = new Date(item.startsAt).getTime();
    if (!Number.isNaN(t) && t < Date.now()) return 'past';
  }
  return 'upcoming';
}

export type AppointmentTab = 'upcoming' | 'past' | 'cancelled';

export function appointmentMatchesTab(item: Appointment, tab: AppointmentTab): boolean {
  const badge = resolveAppointmentBadge(item);
  switch (tab) {
    case 'upcoming':
      return item.status === 'upcoming' && badge === 'upcoming';
    case 'past':
      return item.status === 'completed' || badge === 'past';
    case 'cancelled':
      return item.status === 'cancelled' || badge === 'cancelled';
    default:
      return false;
  }
}
