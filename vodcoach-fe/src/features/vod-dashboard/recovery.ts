import { VOD_STATUS, type VodDTO } from "./api";

const pendingUploadStaleAfterMs = 5 * 60 * 1000;
const uploadedStaleAfterMs = 2 * 60 * 1000;
const processingStaleAfterMs = 10 * 60 * 1000;

export const VOD_RECOVERY_ACTION = {
  completeUpload: "complete_upload",
  retryProcessing: "retry_processing",
} as const;

export type VodRecoveryAction =
  (typeof VOD_RECOVERY_ACTION)[keyof typeof VOD_RECOVERY_ACTION];

export type VodRecovery = {
  action: VodRecoveryAction;
  label: string;
  message: string;
};

type RecoverableVod = Pick<VodDTO, "status" | "updated_at">;

export function getVodRecovery(
  vod: RecoverableVod,
  nowMs: number | null,
): VodRecovery | null {
  if (vod.status === VOD_STATUS.failed) {
    return {
      action: VOD_RECOVERY_ACTION.retryProcessing,
      label: "Retry processing",
      message: "Processing failed. You can retry the worker step.",
    };
  }

  if (nowMs === null) {
    return null;
  }

  const ageMs = getVodStatusAgeMs(vod.updated_at, nowMs);
  if (ageMs === null) {
    return null;
  }

  if (
    vod.status === VOD_STATUS.pendingUpload &&
    ageMs >= pendingUploadStaleAfterMs
  ) {
    return {
      action: VOD_RECOVERY_ACTION.completeUpload,
      label: "Finish upload",
      message:
        "This upload never finished. If the file reached storage, this will queue processing.",
    };
  }

  if (vod.status === VOD_STATUS.uploaded && ageMs >= uploadedStaleAfterMs) {
    return {
      action: VOD_RECOVERY_ACTION.retryProcessing,
      label: "Retry processing",
      message:
        "This VOD was uploaded but processing did not start. This will queue it again.",
    };
  }

  if (vod.status === VOD_STATUS.processing && ageMs >= processingStaleAfterMs) {
    return {
      action: VOD_RECOVERY_ACTION.retryProcessing,
      label: "Retry processing",
      message:
        "Processing has not updated in a while. This will queue processing again.",
    };
  }

  return null;
}

export function canDeleteVod(vod: RecoverableVod, nowMs: number | null) {
  if (
    vod.status === VOD_STATUS.ready ||
    vod.status === VOD_STATUS.failed ||
    vod.status === VOD_STATUS.uploaded ||
    vod.status === VOD_STATUS.pendingUpload
  ) {
    return true;
  }

  const recovery = getVodRecovery(vod, nowMs);

  return recovery !== null;
}

function getVodStatusAgeMs(updatedAt: string, nowMs: number) {
  const updatedAtMs = new Date(updatedAt).getTime();

  if (Number.isNaN(updatedAtMs)) {
    return null;
  }

  return nowMs - updatedAtMs;
}
