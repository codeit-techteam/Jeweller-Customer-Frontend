/**
 * Global boutique open/closed status colors (single source of truth).
 * Import from `BoutiqueStatusBadge` only — do not duplicate in screens.
 */
export const BOUTIQUE_STATUS_THEME = {
  open: {
    background: "#DCFCE7",
    text: "#16A34A",
    dot: "#22C55E",
    border: "rgba(34,197,94,0.25)",
  },
  closed: {
    background: "#FEE2E2",
    text: "#DC2626",
    dot: "#EF4444",
    border: "rgba(239,68,68,0.25)",
  },
} as const;
