import { apiClient } from "@bulkit/app/api/api.client";
import type { StockImageProvider } from "@bulkit/shared/modules/admin/schemas/stock-image-providers.schemas";
import type { PaginatedResponse } from "@bulkit/shared/schemas/misc";
import { queryOptions } from "@tanstack/react-query";

export const STOCK_PROVIDERS_QUERY_KEY = "stock-providers";

type StockProvidersInfiniteQueryOptionsData = {
	initialProviders?: StockImageProvider[];
};

export function stockProvidersQueryOptions(
	opts: StockProvidersInfiniteQueryOptionsData,
) {
	return queryOptions({
		queryKey: [STOCK_PROVIDERS_QUERY_KEY],
		queryFn: async () => {
			const res = await apiClient.admin["stock-image-providers"].get();

			if (res.error) {
				throw new Error(res.error.value.message);
			}

			return res.data;
		},
		initialData: opts.initialProviders,
	});
}
