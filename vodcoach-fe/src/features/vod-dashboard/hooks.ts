import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVods, type VodDTO } from "./api";

export const vodsQueryKey = ["vods"] as const;

export function useVods() {
  return useQuery({
    queryKey: vodsQueryKey,
    queryFn: getVods,
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
