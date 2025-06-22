import { apiClient } from "@bulkit/app/api/api.client";
import type { OrganizationListItem } from "@bulkit/shared/modules/organizations/organizations.schemas";
import type { PaginatedResponse } from "@bulkit/shared/schemas/misc";
import { infiniteQueryOptions } from "@tanstack/react-query";

export const ORGANIZATIONS_QUERY_KEY = "organizations";

type OrganizationsInfiniteQueryOptionsData = {
	initialOrganizations?: PaginatedResponse<OrganizationListItem>;
};

export function organizationsInfiniteQueryOptions(
	opts: OrganizationsInfiniteQueryOptionsData,
) {
	return infiniteQueryOptions({
		queryKey: [ORGANIZATIONS_QUERY_KEY, "infinite"],
		queryFn: async ({ pageParam }) => {
			const res = await apiClient.organizations.get({
				query: {
					limit: 25,
					cursor: pageParam ?? 0,
				},
			});

			if (res.error) {
				throw res.error;
			}

			return res.data;
		},
		initialPageParam: 0,
		initialData: opts.initialOrganizations
			? {
					pages: [opts.initialOrganizations],
					pageParams: [0],
				}
			: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});
}
