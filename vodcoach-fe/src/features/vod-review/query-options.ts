export const REVIEW_SYNC_FOCUSED_INTERVAL_MS = 5000;
export const REVIEW_SYNC_HIDDEN_INTERVAL_MS = 30000;

export const reviewSyncQueryOptions = {
  refetchInterval: () =>
    typeof document !== "undefined" && document.hidden
      ? REVIEW_SYNC_HIDDEN_INTERVAL_MS
      : REVIEW_SYNC_FOCUSED_INTERVAL_MS,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: true,
} as const;
