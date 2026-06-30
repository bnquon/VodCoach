import type { ApiResult } from "@/lib/api-result";
import { setShareSessionToken } from "@/lib/share-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  createShareSession,
  createSharedDrawingsBatch,
  createSharedNote,
  createVodShare,
  getSharedAnnotations,
  getSharedNotes,
  getSharedPlaybackURL,
  getSharedVod,
  getVodShares,
  revokeVodShare,
  sharedAnnotationsQueryKey,
  sharedNotesQueryKey,
  sharedPlaybackURLQueryKey,
  sharedVodQueryKey,
  vodSharesQueryKey,
  type SharePermission,
  type ShareSessionResponse,
} from "./share-api";
import {
  type AnnotationsDTO,
  type CreateDrawingRequestBody,
  type NoteDTO,
  type NoteKind,
} from "./api";
import { reviewSyncQueryOptions } from "./query-options";

type CreateSharedNoteInput = {
  noteKind: NoteKind;
  timestampSeconds: number | null;
  noteText: string;
  tags: string[];
};

export function useVodShares(vodID: string) {
  return useQuery({
    queryKey: vodSharesQueryKey(vodID),
    queryFn: () => getVodShares(vodID),
  });
}

export function useCreateVodShare(vodID: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permission: SharePermission) =>
      createVodShare(vodID, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vodSharesQueryKey(vodID) });
      toast.success("Share link created");
    },
    onError: () => {
      toast.error("Failed to create share link");
    },
  });
}

export function useRevokeVodShare(vodID: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareID: string) => revokeVodShare(vodID, shareID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vodSharesQueryKey(vodID) });
      toast.success("Share link disabled");
    },
    onError: () => {
      toast.error("Failed to disable share link");
    },
  });
}

export function useCreateShareSession(shareToken: string) {
  return useMutation({
    mutationFn: (guestName: string) =>
      createShareSession(shareToken, guestName),
    onSuccess: (session: ShareSessionResponse) => {
      setShareSessionToken(shareToken, session.token);
    },
  });
}

export function useSharedVod(shareToken: string, enabled: boolean) {
  return useQuery({
    queryKey: sharedVodQueryKey(shareToken),
    queryFn: () => getSharedVod(shareToken),
    enabled,
  });
}

export function useSharedPlaybackURL(shareToken: string, enabled: boolean) {
  return useQuery({
    queryKey: sharedPlaybackURLQueryKey(shareToken),
    queryFn: () => getSharedPlaybackURL(shareToken),
    enabled,
    staleTime: 50 * 60 * 1000,
  });
}

export function useSharedNotes(shareToken: string, enabled: boolean) {
  const query = useQuery({
    queryKey: sharedNotesQueryKey(shareToken),
    queryFn: () => getSharedNotes(shareToken),
    enabled,
    ...reviewSyncQueryOptions,
  });
  const [notes, requestError] = query.data ?? [null, null];

  return {
    notes: notes ?? [],
    error: requestError ?? query.error,
    isLoading: query.isLoading,
  };
}

export function useSharedAnnotations(shareToken: string, enabled: boolean) {
  const query = useQuery({
    queryKey: sharedAnnotationsQueryKey(shareToken),
    queryFn: () => getSharedAnnotations(shareToken),
    enabled,
    ...reviewSyncQueryOptions,
  });
  const [annotations, requestError] = query.data ?? [null, null];

  return {
    annotations: annotations ?? { notes: [], drawings: [] },
    error: requestError ?? query.error,
    isLoading: query.isLoading,
  };
}

export function useCreateSharedNote(shareToken: string) {
  const queryClient = useQueryClient();
  const queryKey = sharedNotesQueryKey(shareToken);

  return useMutation({
    mutationFn: (input: CreateSharedNoteInput) =>
      createSharedNote(shareToken, {
        note_kind: input.noteKind,
        timestamp_seconds: input.timestampSeconds,
        note_text: input.noteText,
        tags: input.tags,
      }),
    onSuccess: (createdNote) => {
      queryClient.setQueryData<ApiResult<NoteDTO[]>>(queryKey, (current) => {
        const [currentNotes] = current ?? [[], null];
        return [[...(currentNotes ?? []), createdNote], null];
      });
      queryClient.invalidateQueries({ queryKey });
      toast.success("Note saved");
    },
    onError: () => {
      toast.error("Failed to save note");
    },
  });
}

export function useCreateSharedDrawingsBatch(shareToken: string) {
  const queryClient = useQueryClient();
  const queryKey = sharedAnnotationsQueryKey(shareToken);

  return useMutation({
    mutationFn: (drawings: CreateDrawingRequestBody[]) =>
      createSharedDrawingsBatch(shareToken, { drawings }),
    onSuccess: (createdDrawings) => {
      queryClient.setQueryData<ApiResult<AnnotationsDTO>>(
        queryKey,
        (current) => {
          const [annotations, error] = current ?? [null, null];
          if (!annotations) {
            return current;
          }

          return [
            {
              ...annotations,
              drawings: [...annotations.drawings, ...createdDrawings],
            },
            error,
          ];
        },
      );
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error("Failed to save drawings");
    },
  });
}
