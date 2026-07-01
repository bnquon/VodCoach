import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  deleteVod,
  getVod,
  getVods,
  retryVodProcessing,
  updateVod,
  VOD_STATUS,
  type UpdateVodInput,
  type VodDTO,
  type VodStatus,
} from "./api";

export const vodsQueryKey = ["vods"] as const;
export const vodQueryKey = (vodID: string) => ["vod", vodID] as const;

const POLLING_VOD_STATUSES: VodStatus[] = [
  VOD_STATUS.pendingUpload,
  VOD_STATUS.uploaded,
  VOD_STATUS.processing,
];

type UpdateVodMutationInput = UpdateVodInput & {
  vodID: string;
};

export function useVods() {
  return useQuery({
    queryKey: vodsQueryKey,
    queryFn: getVods,
    refetchInterval: (query) => {
      const vods = query.state.data;
      const hasProcessingVod = vods?.some((vod) =>
        POLLING_VOD_STATUSES.includes(vod.status),
      );

      return hasProcessingVod ? 3000 : false;
    },
  });
}

export function useVod(vodID: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: vodQueryKey(vodID),
    queryFn: () => getVod(vodID),
    initialData: () =>
      queryClient
        .getQueryData<VodDTO[]>(vodsQueryKey)
        ?.find((vod) => vod.id === vodID),
    staleTime: 30 * 1000,
  });
}

export function useAddVodToCache() {
  const queryClient = useQueryClient();

  return (vod: VodDTO) => {
    queryClient.setQueryData<VodDTO[]>(vodsQueryKey, (currentVods) => {
      const vods = currentVods ?? [];
      const vodAlreadyExists = vods.some(
        (currentVod) => currentVod.id === vod.id,
      );

      if (vodAlreadyExists) {
        return vods.map((currentVod) =>
          currentVod.id === vod.id ? vod : currentVod,
        );
      }

      return [vod, ...vods];
    });
  };
}

export function useDeleteVod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVod,
    onMutate: async (vodID) => {
      await queryClient.cancelQueries({ queryKey: vodsQueryKey });

      const previousVods = queryClient.getQueryData<VodDTO[]>(vodsQueryKey);

      queryClient.setQueryData<VodDTO[]>(vodsQueryKey, (currentVods) =>
        (currentVods ?? []).filter((vod) => vod.id !== vodID),
      );

      return { previousVods };
    },
    onError: (error, _vodID, context) => {
      queryClient.setQueryData(vodsQueryKey, context?.previousVods);
      toast.error(getDeleteVodErrorMessage(error));
    },
    onSuccess: () => {
      toast.success("VOD deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: vodsQueryKey });
    },
  });
}

export function useRetryVodProcessing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryVodProcessing,
    onMutate: async (vodID) => {
      await queryClient.cancelQueries({ queryKey: vodsQueryKey });

      const previousVods = queryClient.getQueryData<VodDTO[]>(vodsQueryKey);

      queryClient.setQueryData<VodDTO[]>(vodsQueryKey, (currentVods) =>
        (currentVods ?? []).map((vod) =>
          vod.id === vodID
            ? {
                ...vod,
                status: VOD_STATUS.uploaded,
                processing_progress: 0,
                error_message: null,
              }
            : vod,
        ),
      );

      return { previousVods };
    },
    onError: (error, _vodID, context) => {
      queryClient.setQueryData(vodsQueryKey, context?.previousVods);
      toast.error(getVodMutationErrorMessage(error, "Failed to retry VOD"));
    },
    onSuccess: (updatedVod) => {
      queryClient.setQueryData<VodDTO[]>(vodsQueryKey, (currentVods) =>
        (currentVods ?? []).map((vod) =>
          vod.id === updatedVod.id ? updatedVod : vod,
        ),
      );
      queryClient.setQueryData(vodQueryKey(updatedVod.id), updatedVod);
      toast.success("VOD retry queued");
    },
    onSettled: (_data, _error, vodID) => {
      queryClient.invalidateQueries({ queryKey: vodsQueryKey });
      queryClient.invalidateQueries({ queryKey: vodQueryKey(vodID) });
    },
  });
}

export function useUpdateVod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vodID, ...input }: UpdateVodMutationInput) =>
      updateVod(vodID, input),
    onSuccess: (updatedVod) => {
      queryClient.setQueryData<VodDTO[]>(vodsQueryKey, (currentVods) =>
        (currentVods ?? []).map((vod) =>
          vod.id === updatedVod.id ? updatedVod : vod,
        ),
      );
      queryClient.setQueryData(vodQueryKey(updatedVod.id), updatedVod);
      toast.success("VOD updated");
    },
    onError: (error) => {
      toast.error(getVodMutationErrorMessage(error, "Failed to update VOD"));
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({ queryKey: vodsQueryKey });
      queryClient.invalidateQueries({ queryKey: vodQueryKey(input.vodID) });
    },
  });
}

function getDeleteVodErrorMessage(error: unknown) {
  return getVodMutationErrorMessage(error, "Failed to delete VOD");
}

function getVodMutationErrorMessage(error: unknown, fallbackMessage: string) {
  if (isAxiosError(error)) {
    return typeof error.response?.data?.error === "string"
      ? error.response.data.error
      : error.message;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
