import { apiClient } from "@bulkit/app/api/api.client";
import type { AIImageProvider } from "@bulkit/shared/modules/admin/schemas/ai-image-providers.schemas";
import { queryOptions } from "@tanstack/react-query";

export const AI_IMAGE_PROVIDERS_QUERY_KEY = "ai-image-providers";

type AIImageProvidersQueryOptionsData = {
	initialProviders?: AIImageProvider[];
};

export function aiImageProvidersQueryOptions(
	opts: AIImageProvidersQueryOptionsData,
) {
	return queryOptions({
		queryKey: [AI_IMAGE_PROVIDERS_QUERY_KEY],
		queryFn: async () => {
			const res = await apiClient.admin["ai-image-providers"].get();

			if (res.error) {
				throw new Error(res.error.value.message);
			}

			return res.data;
		},
		initialData: opts.initialProviders,
	});
}
