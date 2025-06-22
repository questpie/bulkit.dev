import { apiClient } from "@bulkit/app/api/api.client";
import type { Resource } from "@bulkit/shared/modules/resources/resources.schemas";
import type { PaginatedResponse } from "@bulkit/shared/schemas/misc";
import { infiniteQueryOptions } from "@tanstack/react-query";

export const MEDIA_QUERY_KEY = "media";

type MediaInfiniteQueryOptionsData = {
	initialResources?: PaginatedResponse<Resource>;
	search?: string;
};

export function mediaInfiniteQueryOptions(opts: MediaInfiniteQueryOptionsData) {
	return infiniteQueryOptions({
		queryKey: [MEDIA_QUERY_KEY, "infinite", opts.search ?? ""],
		queryFn: async ({ pageParam }) => {
			const res = await apiClient.resources.get({
				query: {
					limit: 25,
					cursor: pageParam ?? 0,
					search: opts.search ?? "",
				},
			});

			if (res.error) {
				throw res.error;
			}

			return res.data;
		},
		initialPageParam: 0,
		initialData: opts.initialResources
			? {
					pages: [opts.initialResources],
					pageParams: [0],
				}
			: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});
}
