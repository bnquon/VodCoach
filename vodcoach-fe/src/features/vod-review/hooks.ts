import type { ApiResult } from "@/lib/api-result";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  createVodDrawingsBatch,
  createVodNote,
  deleteVodNote,
  getVodAnnotations,
  getVodNotes,
  TEST_VOD_ID,
  updateVodNote,
  vodAnnotationsQueryKey,
  vodNotesQueryKey,
  type AnnotationsDTO,
  type CreateDrawingRequestBody,
  type NoteDTO,
  type NoteKind,
} from "./api";

type CreateVodNoteInput = {
  noteKind: NoteKind;
  timestampSeconds: number | null;
  noteText: string;
  tags: string[];
};

type UpdateVodNoteInput = {
  id: string;
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

export function useUpdateVodNote() {
  const queryClient = useQueryClient();
  const queryKey = vodNotesQueryKey(TEST_VOD_ID);

  return useMutation({
    mutationFn: (input: UpdateVodNoteInput) =>
      updateVodNote(TEST_VOD_ID, input.id, {
        timestamp_seconds: input.timestampSeconds,
        note_text: input.noteText,
        tags: input.tags,
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });

      const previousNotesResult =
        queryClient.getQueryData<ApiResult<NoteDTO[]>>(queryKey);

      queryClient.setQueryData<ApiResult<NoteDTO[]>>(queryKey, (current) => {
        const [currentNotes] = current ?? [[], null];

        return [
          (currentNotes ?? []).map((note) =>
            note.id === input.id
              ? {
                  ...note,
                  timestamp_seconds: input.timestampSeconds,
                  note_text: input.noteText,
                  tags: input.tags,
                }
              : note,
          ),
          null,
        ];
      });

      return { previousNotesResult };
    },
    onError: (error, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotesResult);
      toast.error(
        error instanceof Error ? error.message : "Failed to update note",
      );
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData<ApiResult<NoteDTO[]>>(queryKey, (current) => {
        const [currentNotes] = current ?? [[], null];

        return [
          (currentNotes ?? []).map((note) =>
            note.id === updatedNote.id ? updatedNote : note,
          ),
          null,
        ];
      });
      toast.success("Note updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteVodNote() {
  const queryClient = useQueryClient();
  const queryKey = vodNotesQueryKey(TEST_VOD_ID);

  return useMutation({
    mutationFn: (noteID: string) => deleteVodNote(TEST_VOD_ID, noteID),
    onMutate: async (noteID) => {
      await queryClient.cancelQueries({ queryKey });

      const previousNotesResult =
        queryClient.getQueryData<ApiResult<NoteDTO[]>>(queryKey);

      queryClient.setQueryData<ApiResult<NoteDTO[]>>(queryKey, (current) => {
        const [currentNotes] = current ?? [[], null];

        return [
          (currentNotes ?? []).filter((note) => note.id !== noteID),
          null,
        ];
      });

      return { previousNotesResult };
    },
    onError: (error, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotesResult);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete note",
      );
    },
    onSuccess: () => {
      toast.success("Note deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useVodAnnotations() {
  const query = useQuery({
    queryKey: vodAnnotationsQueryKey(TEST_VOD_ID),
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

export function useCreateVodDrawingsBatch() {
  const queryClient = useQueryClient();
  const queryKey = vodAnnotationsQueryKey(TEST_VOD_ID);

  return useMutation({
    mutationFn: (drawings: CreateDrawingRequestBody[]) =>
      createVodDrawingsBatch(TEST_VOD_ID, { drawings }),
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
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save drawings",
      );
    },
  });
}
