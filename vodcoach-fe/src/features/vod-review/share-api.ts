import { api } from "@/lib/api";
import { toApiResult } from "@/lib/api-result";
import { createShareApi } from "@/lib/share-api";
import type { VodDTO } from "@/features/vod-dashboard/api";
import type {
  AnnotationsDTO,
  CreateDrawingsRequestBody,
  CreateNoteRequestBody,
  DrawingDTO,
  NoteDTO,
  VodPlaybackURLDTO,
} from "./api";

export const SHARE_PERMISSION = {
  view: "view",
  comment: "comment",
} as const;

export type SharePermission =
  (typeof SHARE_PERMISSION)[keyof typeof SHARE_PERMISSION];

export type VodShareDTO = {
  id: string;
  vod_id: string;
  permission: SharePermission;
  expires_at: string | null;
  created_at: string;
};

export type CreateVodShareResponse = VodShareDTO & {
  token: string;
};

export type ShareSessionResponse = {
  token: string;
  share: VodShareDTO;
  guest_name: string;
  permission: SharePermission;
};

export const vodSharesQueryKey = (vodID: string) =>
  ["vod-shares", vodID] as const;
export const sharedVodQueryKey = (shareToken: string) =>
  ["shared-vod", shareToken] as const;
export const sharedNotesQueryKey = (shareToken: string) =>
  ["shared-notes", shareToken] as const;
export const sharedAnnotationsQueryKey = (shareToken: string) =>
  ["shared-annotations", shareToken] as const;
export const sharedPlaybackURLQueryKey = (shareToken: string) =>
  ["shared-playback-url", shareToken] as const;

export async function createVodShare(
  vodID: string,
  permission: SharePermission,
) {
  const response = await api.post<CreateVodShareResponse>(
    `/vods/${vodID}/shares`,
    { permission },
  );

  return response.data;
}

export async function getVodShares(vodID: string) {
  const response = await api.get<VodShareDTO[]>(`/vods/${vodID}/shares`);

  return response.data;
}

export async function revokeVodShare(vodID: string, shareID: string) {
  await api.delete(`/vods/${vodID}/shares/${shareID}`);
}

export async function createShareSession(
  shareToken: string,
  guestName: string,
) {
  const response = await api.post<ShareSessionResponse>(
    `/shares/${shareToken}/session`,
    { guest_name: guestName },
  );

  return response.data;
}

export async function getSharedVod(shareToken: string) {
  const response = await createShareApi(shareToken).get<VodDTO>("/shares/vod");

  return response.data;
}

export async function getSharedPlaybackURL(shareToken: string) {
  const response = await createShareApi(shareToken).get<VodPlaybackURLDTO>(
    "/shares/playback-url",
  );

  return response.data;
}

export async function getSharedNotes(shareToken: string) {
  return toApiResult(
    createShareApi(shareToken)
      .get<NoteDTO[]>("/shares/notes")
      .then((response) => response.data),
  );
}

export async function getSharedAnnotations(shareToken: string) {
  return toApiResult(
    createShareApi(shareToken)
      .get<AnnotationsDTO>("/shares/annotations")
      .then((response) => response.data),
  );
}

export async function createSharedNote(
  shareToken: string,
  body: CreateNoteRequestBody,
) {
  return createShareApi(shareToken)
    .post<NoteDTO>("/shares/notes", body)
    .then((response) => response.data);
}

export async function createSharedDrawingsBatch(
  shareToken: string,
  body: CreateDrawingsRequestBody,
) {
  return createShareApi(shareToken)
    .post<DrawingDTO[]>("/shares/annotations/batch", body)
    .then((response) => response.data);
}
