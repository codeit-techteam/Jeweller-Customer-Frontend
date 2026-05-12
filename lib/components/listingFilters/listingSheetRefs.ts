import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type React from 'react';

/** Ref target for @gorhom/bottom-sheet `BottomSheetModal` imperative API (`present` / `dismiss`). */
export type ListingSheetModalRef = React.ComponentRef<typeof BottomSheetModal>;

export type ListingSheetRefs = {
  filter: React.RefObject<ListingSheetModalRef | null>;
  sort: React.RefObject<ListingSheetModalRef | null>;
  price: React.RefObject<ListingSheetModalRef | null>;
  metal: React.RefObject<ListingSheetModalRef | null>;
};
