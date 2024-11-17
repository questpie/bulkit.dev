import { apiClient } from '@bulkit/app/api/api.client'
import type { ChannelListItem } from '@bulkit/shared/modules/channels/channels.schemas'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { infiniteQueryOptions } from '@tanstack/react-query'

export const CHANNELS_QUERY_KEY = 'channels'

type ChannelsInfiniteQueryOptionsData = {
  initialChannels?: PaginatedResponse<ChannelListItem>
}

export function channelsInfiniteQueryOptions(opts: ChannelsInfiniteQueryOptionsData) {
  return infiniteQueryOptions({
    queryKey: [CHANNELS_QUERY_KEY, 'infinite'],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.channels.index.get({
        query: {
          limit: 25,
          cursor: pageParam ?? 0,
        },
      })

      if (res.error) {
        throw res.error
      }

      return res.data
    },
    initialPageParam: 0,
    initialData: opts.initialChannels
      ? {
          pages: [opts.initialChannels],
          pageParams: [0],
        }
      : undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
