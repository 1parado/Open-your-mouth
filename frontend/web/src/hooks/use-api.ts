import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface ApiMutationOptions {
  invalidateQueryKeys?: QueryKey[];
}

export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  options = {}
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get(endpoint);
      return response.data;
    },
    ...options,
  });
}

export function useApiMutation<T, D = unknown>(
  endpoint: string,
  method: "post" | "put" | "delete" | "patch" = "post",
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: D) => {
      const response =
        method === "delete"
          ? await apiClient.delete(endpoint)
          : method === "patch"
            ? await apiClient.patch(endpoint, data)
            : method === "put"
              ? await apiClient.put(endpoint, data)
              : await apiClient.post(endpoint, data);
      return response.data as T;
    },
    onSuccess: () => {
      const invalidateQueryKeys = options.invalidateQueryKeys ?? [[endpoint]];

      invalidateQueryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });
}
