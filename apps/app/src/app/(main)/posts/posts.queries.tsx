import { apiClient } from "@bulkit/app/api/api.client";
import type { PostListItem } from "@bulkit/shared/modules/posts/posts.schemas";
import type { PaginatedResponse } from "@bulkit/shared/schemas/misc";
import { infiniteQueryOptions } from "@tanstack/react-query";

export const POSTS_QUERY_KEY = "posts";

type PostsInfiniteQueryOptionsData = {
	initialPosts?: PaginatedResponse<PostListItem>;
};

export function postsInfiniteQueryOptions(opts: PostsInfiniteQueryOptionsData) {
	return infiniteQueryOptions({
		queryKey: [POSTS_QUERY_KEY, "infinite"],
		queryFn: async ({ pageParam }) => {
			const res = await apiClient.posts.get({
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
		initialData: opts.initialPosts
			? {
					pages: [opts.initialPosts],
					pageParams: [0],
				}
			: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});
}
