import axios from "axios";
import { api } from "@/lib/api";

export const VOD_STATUS = {
  pendingUpload: "pending_upload",
  uploaded: "uploaded",
  processing: "processing",
  ready: "ready",
  failed: "failed",
} as const;

export type VodStatus = (typeof VOD_STATUS)[keyof typeof VOD_STATUS];

export type VodDTO = {
  id: string;
  title: string;
  game: string;
  original_storage_key: string;
  thumbnail_storage_key: string | null;
  original_filename: string | null;
  content_type: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  status: VodStatus;
  processing_progress: number;
  error_message: string | null;
  updated_at: string;
};

const THUMBNAIL_PUBLIC_BASE_URL =
  "https://pub-a560d09a92e746ebb509e3c04d8fec01.r2.dev";

export function getStorageObjectURL(storageKey: string | null) {
  const normalizedStorageKey = storageKey?.trim();

  if (!normalizedStorageKey) {
    return null;
  }

  if (normalizedStorageKey.startsWith("http")) {
    return normalizedStorageKey;
  }

  return `${THUMBNAIL_PUBLIC_BASE_URL}/${normalizedStorageKey.replace(/^\/+/, "")}`;
}

export type CreateVodUploadInput = {
  title: string;
  game: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
};

export type CreateVodUploadResponse = {
  vod: VodDTO;
  upload_url: string;
  original_storage_key: string;
  thumbnail_storage_key: string;
};

type UploadVodFileInput = {
  uploadURL: string;
  file: File;
  contentType: string;
  onProgress?: (progress: number) => void;
};

export async function createVodUpload(input: CreateVodUploadInput) {
  const response = await api.post<CreateVodUploadResponse>("/vods/upload", {
    title: input.title,
    game: input.game,
    file_name: input.fileName,
    content_type: input.contentType,
    file_size_bytes: input.fileSizeBytes,
  });

  return response.data;
}

export async function getVods() {
  const response = await api.get<VodDTO[]>("/vods");

  return response.data;
}

export async function completeVodUpload(vodID: string) {
  const response = await api.post<VodDTO>(`/vods/${vodID}/upload-complete`);

  return response.data;
}

export async function uploadVodFile({
  uploadURL,
  file,
  contentType,
  onProgress,
}: UploadVodFileInput) {
  await axios.put(uploadURL, file, {
    headers: {
      "Content-Type": contentType,
    },
    onUploadProgress: (event) => {
      if (!event.total) {
        return;
      }

      onProgress?.(Math.round((event.loaded / event.total) * 100));
    },
  });
}
