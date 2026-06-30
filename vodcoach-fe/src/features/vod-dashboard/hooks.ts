import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVods, VOD_STATUS, type VodDTO, type VodStatus } from "./api";

export const vodsQueryKey = ["vods"] as const;
const POLLING_VOD_STATUSES: VodStatus[] = [
  VOD_STATUS.pendingUpload,
  VOD_STATUS.uploaded,
  VOD_STATUS.processing,
];

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
