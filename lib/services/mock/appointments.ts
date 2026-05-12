export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

/** Derived badge for luxury status pill (includes overdue upcoming → past). */
export type AppointmentBadge = 'upcoming' | 'past' | 'completed' | 'cancelled';

/** UI + API shape for appointment list / detail / cards */
export type Appointment = {
  id: string;
  boutiqueId?: string | null;
  boutiqueName: string;
  /** Display date e.g. "March 28, 2026" */
  date: string;
  /** e.g. "11:30 AM"; omit for completed-only display if empty */
  time: string;
  status: AppointmentStatus;
  /** Server-derived badge; falls back to status in UI when absent */
  badge?: AppointmentBadge;
  address: string;
  /** Optional hero image URI */
  image?: string;
  /** Stable key for cover image derivation when `image` missing */
  boutiqueSlug?: string;
  /** ISO instant from API for ordering / expired detection */
  startsAt?: string | null;
  /** E.g. "Bridal Consultation" */
  consultationType?: string;
  /** Boutique phone for tel: links */
  phone?: string;
};

/** @deprecated No seed data — appointments load from `/api/appointments/:userId`. */
export const mockAppointments: Appointment[] = [];
