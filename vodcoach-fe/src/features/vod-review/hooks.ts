import type { ApiResult } from "@/lib/api-result";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  createVodNote,
  getVodAnnotations,
  getVodNotes,
  TEST_VOD_ID,
  vodNotesQueryKey,
  type NoteDTO,
  type NoteKind,
} from "./api";

type CreateVodNoteInput = {
  noteKind: NoteKind;
  timestampSeconds: number | null;
  noteText: string;
  tags: string[];
};

export function useVodNotes() {
  const query = useQuery({
    queryKey: vodNotesQueryKey(TEST_VOD_ID),
    queryFn: () => getVodNotes(TEST_VOD_ID),
  });
  const [notes, requestError] = query.data ?? [null, null];

  return {
    notes: notes ?? [],
    error: requestError ?? query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useCreateVodNote() {
  const queryClient = useQueryClient();
  const queryKey = vodNotesQueryKey(TEST_VOD_ID);

  return useMutation({
    mutationFn: (input: CreateVodNoteInput) =>
      createVodNote(TEST_VOD_ID, {
        note_kind: input.noteKind,
        timestamp_seconds: input.timestampSeconds,
        note_text: input.noteText,
        tags: input.tags,
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });

      const previousNotesResult =
        queryClient.getQueryData<ApiResult<NoteDTO[]>>(queryKey);
      const [previousNotes] = previousNotesResult ?? [[], null];
      const optimisticNoteID = `optimistic-${crypto.randomUUID()}`;
      const optimisticNote: NoteDTO = {
        id: optimisticNoteID,
        vod_id: TEST_VOD_ID,
        note_kind: input.noteKind,
        timestamp_seconds: input.timestampSeconds,
        note_text: input.noteText,
        tags: input.tags,
      };

      queryClient.setQueryData<ApiResult<NoteDTO[]>>(queryKey, [
        [...(previousNotes ?? []), optimisticNote],
        null,
      ]);

      return { optimisticNoteID, previousNotesResult };
    },
    onError: (error, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotesResult);
      toast.error(
        error instanceof Error ? error.message : "Failed to save note",
      );
    },
    onSuccess: (createdNote, _input, context) => {
      queryClient.setQueryData<ApiResult<NoteDTO[]>>(queryKey, (current) => {
        const [currentNotes] = current ?? [[], null];

        return [
          (currentNotes ?? []).map((note) =>
            note.id === context.optimisticNoteID ? createdNote : note,
          ),
          null,
        ];
      });
      toast.success("Note saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useVodAnnotations() {
  const query = useQuery({
    queryKey: ["vod-annotations", TEST_VOD_ID],
    queryFn: () => getVodAnnotations(TEST_VOD_ID),
  });
  const [annotations, requestError] = query.data ?? [null, null];

  return {
    annotations: annotations ?? { notes: [], drawings: [] },
    error: requestError ?? query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
