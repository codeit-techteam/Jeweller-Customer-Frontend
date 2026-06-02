/**
 * Shared FlatList tuning for long product/boutique lists.
 * Reduces off-screen work without changing list behavior.
 */
export const FLAT_LIST_WINDOWED_PROPS = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 8,
  updateCellsBatchingPeriod: 50,
  windowSize: 7,
  initialNumToRender: 8,
} as const;

export const FLAT_LIST_HORIZONTAL_PROPS = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 5,
  updateCellsBatchingPeriod: 50,
  windowSize: 5,
  initialNumToRender: 4,
} as const;
