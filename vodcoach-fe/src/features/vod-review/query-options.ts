export const REVIEW_SYNC_INTERVAL_MS = 4000;

export const reviewSyncQueryOptions = {
  refetchInterval: REVIEW_SYNC_INTERVAL_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
} as const;
