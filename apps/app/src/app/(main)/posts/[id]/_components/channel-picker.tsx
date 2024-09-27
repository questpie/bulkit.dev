import { apiClient } from '@bulkit/app/api/api.client'
import type { Channel } from '@bulkit/app/app/(main)/channels/_components/channels-table'
import { dedupe } from '@bulkit/shared/types/data'
import { capitalize } from '@bulkit/shared/utils/string'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { useDebouncedValue } from '@bulkit/ui/hooks/use-debounce'
import { cn } from '@bulkit/ui/lib'
import { useInfiniteQuery } from '@tanstack/react-query'
import type React from 'react'
import { useState } from 'react'
import { PiPlus } from 'react-icons/pi'

type ChannelPickerProps = {
  value: Channel[]
  onValueChange: (value: Channel[]) => void
}

const ChannelPicker: React.FC<ChannelPickerProps> = ({ value, onValueChange }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(value)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebouncedValue(searchQuery, 200)

  const channelsQuery = useInfiniteQuery({
    queryKey: ['channels-infinite-query', debouncedQuery],
    queryFn: (opts) => {
      return apiClient.channels.index.get({
        query: {
          limit: 12,
          cursor: opts.pageParam,
          q: debouncedQuery,
        },
      })
    },
    initialPageParam: 1,
    getNextPageParam: (prev) => prev.data?.nextCursor,
  })

  const handleApply = () => {
    onValueChange(selectedChannels)
    setIsDialogOpen(false)
    setSearchQuery('')
  }

  const flatList = dedupe(
    [...value, channelsQuery.data?.pages.flatMap((p) => p.data?.data ?? []) ?? []] as Channel[],
    ['id']
  )

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {value.map((channel) => (
          <Avatar key={channel.id}>
            <AvatarImage src={channel.imageUrl ?? undefined} />
            <AvatarFallback>{capitalize(channel.name[0]!)}</AvatarFallback>
          </Avatar>
        ))}

        <Avatar role='button'>
          <AvatarImage src={undefined} />
          <AvatarFallback>
            <PiPlus />
          </AvatarFallback>
        </Avatar>
      </div>

      <ResponsiveDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Your channels</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <div className='flex flex-wrap gap-4 '>
            {flatList.map((channel) => {
              const isSelected = !!selectedChannels.find((v) => v.id === channel.id)

              return (
                <Card
                  key={channel.id}
                  className={cn(
                    'p-4 flex flex-col gap-2',
                    isSelected && 'border-primary bg-primary/20 text-primary'
                  )}
                  onClick={() => {
                    if (!isSelected) return setSelectedChannels([...selectedChannels, channel])
                    setSelectedChannels(selectedChannels.filter((s) => s.id !== channel.id))
                  }}
                >
                  <Avatar key={channel.id}>
                    <AvatarImage src={channel.imageUrl ?? undefined} />
                    <AvatarFallback>{capitalize(channel.name[0]!)}</AvatarFallback>
                  </Avatar>
                  <span>{channel.name}</span>
                </Card>
              )
            })}

            {channelsQuery.hasNextPage && (
              <div>
                <Button variant='outline' className='w-full md:w-auto' onClick={handleApply}>
                  Load more
                </Button>
              </div>
            )}
          </div>

          <ResponsiveDialogFooter>
            <Button>Apply</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}

export default ChannelPicker
