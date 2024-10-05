'use client'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { PLATFORM_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import { capitalize } from '@bulkit/shared/utils/string'
import { cn } from '@bulkit/transactional/style-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@bulkit/ui/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@bulkit/ui/components/ui/collapsible'
import { DatePicker } from '@bulkit/ui/components/ui/date-picker'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@bulkit/ui/components/ui/form'
import { addYears } from 'date-fns'
import { useFormContext } from 'react-hook-form'
import { PiCaretDown } from 'react-icons/pi'

export function PublishSettings() {
  const form = useFormContext<Post>()

  const channels = form.watch('channels')

  return (
    <div className='flex flex-col px-4 gap-4'>
      <Card className='p-4'>
        <FormField
          control={form.control}
          name='scheduledAt'
          render={({ field }) => (
            <FormItem className={cn('flex flex-row items-center gap-2 w-full justify-between')}>
              <div className='space-y-0.5 flex-1'>
                <FormLabel className='text-base'>
                  Global Publish Time{' '}
                  <span className='text-muted-foreground text-xs'>(Optional)</span>
                </FormLabel>
                <FormDescription>
                  Set a default publish time for all channels. If left blank, posts will be
                  published immediately. You can override this setting for individual channels
                  below.
                </FormDescription>
              </div>
              <div className='flex-1 flex justify-end'>
                <FormControl>
                  <DatePicker
                    value={field.value ?? undefined}
                    onValueChange={(date) => {
                      field.onChange(date?.toISOString() ?? null)
                    }}
                    showTime
                    calendarProps={{
                      toDate: addYears(new Date(), 5),
                      fromDate: new Date(),
                    }}
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />
      </Card>

      {!!channels?.length &&
        channels.map((channel, index) => {
          const ChannelIcon = PLATFORM_ICON[channel.platform]

          return (
            <Collapsible key={channel.id} className='group' defaultOpen>
              <Card className='flex flex-col gap-4'>
                <CollapsibleTrigger className='w-full'>
                  <CardHeader className='flex flex-row gap-2 w-full justify-between'>
                    <div className='flex flex-row gap-2'>
                      <Avatar>
                        <AvatarImage src={channel.imageUrl ?? undefined} />
                        <AvatarFallback>{capitalize(channel.name[0]!)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className='font-semibold'>{channel.name}</h4>
                        <div className='flex gap-2 items-center'>
                          <ChannelIcon className='size-4' />
                          <p className='text-sm text-muted-foreground'>
                            {PLATFORM_TO_NAME[channel.platform]}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='flex-1 flex justify-end'>
                      <PiCaretDown className='transition-transform size-6 group-data-[state=open]:rotate-180' />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name={`channels.${index}.scheduledPost.scheduledAt`}
                      render={({ field }) => (
                        <FormItem
                          className={cn('flex flex-row items-center gap-2 w-full justify-between')}
                        >
                          <div className='space-y-0.5 flex-1'>
                            <FormLabel className='text-base'>
                              Channel-Specific Publish Time
                            </FormLabel>
                            <FormDescription>
                              Set a custom publish time for this channel, overriding the global
                              setting. Leave blank to use the global publish time.
                            </FormDescription>
                          </div>
                          <div className='flex-1 flex justify-end'>
                            <FormControl>
                              <DatePicker
                                value={field.value ?? undefined}
                                onValueChange={(date) =>
                                  field.onChange(date?.toISOString() ?? null)
                                }
                                showTime
                                calendarProps={{
                                  toDate: addYears(new Date(), 5),
                                  fromDate: new Date(),
                                }}
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )
        })}

      {/* <FormField
            control={form.control}
            name='repostSettings'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Repost Settings</FormLabel>
                  <FormDescription>Enable repost settings for this post</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value !== null}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? { maxReposts: 1, delaySeconds: 3600 } : null)
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          /> */}

      {/* <FormField
            control={form.control}
            name='parentPostSettings'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Parent Post Settings</FormLabel>
                  <FormDescription>Enable parent post settings for this post</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value !== null}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? { delaySeconds: 3600 } : null)
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          /> */}
    </div>
  )
}
