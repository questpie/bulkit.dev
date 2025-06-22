'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { calculateCostPerMillion } from '@bulkit/app/app/(main)/admin/ai-providers/ai-proivders.utils'
import { aiProvidersQueryOptions } from '@bulkit/app/app/(main)/admin/ai-providers/ai-providers.queries'
import { useAppSettings } from '@bulkit/app/app/_components/app-settings-provider'
import {
  AddAIProviderSchema,
  UpdateAIProviderSchema,
  type AddAIProvider,
  type UpdateAIProvider,
} from '@bulkit/shared/modules/admin/schemas/ai-providers.schemas'
import {
  AI_TEXT_CAPABILITIES,
  AI_TEXT_PROVIDER_TYPES,
} from '@bulkit/shared/modules/app/app-constants'
import { Button } from '@bulkit/ui/components/ui/button'
import { Checkbox } from '@bulkit/ui/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { Input } from '@bulkit/ui/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@bulkit/ui/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { toast } from '@bulkit/ui/components/ui/sonner'
import useControllableState from '@bulkit/ui/hooks/use-controllable-state'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'

type AIProviderFormProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultValues?: Partial<AddAIProvider | UpdateAIProvider>
  mode?: 'add' | 'edit'
}

export function AIProviderForm(props: PropsWithChildren<AIProviderFormProps>) {
  const [open, setOpen] = useControllableState({
    defaultValue: props.open ?? false,
    onChange: props.onOpenChange,
    value: props.open,
  })

  const appSettings = useAppSettings()

  const isCloud = appSettings.deploymentType === 'cloud'

  const form = useForm<UpdateAIProvider | AddAIProvider>({
    resolver: typeboxResolver(props.mode === 'edit' ? UpdateAIProviderSchema : AddAIProviderSchema),
    defaultValues: props.defaultValues || {
      name: 'anthropic',
      model: '',
      capabilities: [],
      isActive: true,
      isDefaultFor: [],
      promptTokenToCreditCoefficient: 0.0001,
      outputTokenToCreditCoefficient: 0.0002,
    },
  })

  const queryClient = useQueryClient()

  const editMutation = useMutation({
    mutationFn: async (values: UpdateAIProvider) => {
      const response = await apiClient.admin['ai-providers'].put({
        ...values,
        apiKey: values.apiKey || undefined,
      })
      if (response.error) throw new Error(response.error.value.message)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProvidersQueryOptions({}).queryKey })
      setOpen(false)
      toast.success('Provider updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update provider', {
        description: error.message,
      })
    },
  })

  const addMutation = useMutation({
    mutationFn: async (values: AddAIProvider) => {
      const response = await apiClient.admin['ai-providers'].post(values)
      if (response.error) throw new Error(response.error.value.message)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProvidersQueryOptions({}).queryKey })
      setOpen(false)
      toast.success('Provider added successfully')
    },
    onError: (error) => {
      toast.error('Failed to add provider', {
        description: error.message,
      })
    },
  })

  const handleSubmit = form.handleSubmit((values) => {
    if (props.mode === 'edit') editMutation.mutate(values as UpdateAIProvider)
    else addMutation.mutate(values as AddAIProvider)
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {props.children}

      <SheetContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='h-full relative flex flex-col gap-4'>
            <SheetHeader>
              <SheetTitle>{props.mode === 'edit' ? 'Edit' : 'Add'} AI Provider</SheetTitle>
            </SheetHeader>

            <div className='flex flex-col flex-1 gap-4 overflow-auto'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={props.mode === 'edit'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a provider' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AI_TEXT_PROVIDER_TYPES.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='model'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter model name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='apiKey'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder={props.mode === 'edit' ? 'Enter new API key' : 'Enter API key'}
                        {...field}
                      />
                    </FormControl>
                    {props.mode === 'edit' && (
                      <p className='text-xs text-muted-foreground'>
                        Leave empty to keep the current API key
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='capabilities'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capabilities</FormLabel>
                    <div className='space-y-2'>
                      {AI_TEXT_CAPABILITIES.map((capability) => (
                        <FormControl key={capability}>
                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              checked={field.value.includes(capability)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, capability]
                                  : field.value.filter((v) => v !== capability)
                                field.onChange(newValue)
                              }}
                            />
                            <span className='text-sm'>{capability}</span>
                          </div>
                        </FormControl>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-center space-x-2'>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className='!mt-0'>Active</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isDefaultFor'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default For</FormLabel>
                    <div className='space-y-2'>
                      {AI_TEXT_CAPABILITIES.map((capability) => (
                        <FormControl key={capability}>
                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              checked={field.value.includes(capability)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, capability]
                                  : field.value.filter((v) => v !== capability)
                                field.onChange(newValue)
                              }}
                            />
                            <span className='text-sm'>{capability}</span>
                          </div>
                        </FormControl>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCloud && (
                <>
                  <FormField
                    control={form.control}
                    name='promptTokenToCreditCoefficient'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt Token Credit Cost</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={0}
                            step='0.00001'
                            placeholder='Enter credit cost per prompt token'
                            {...field}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <p className='text-xs text-muted-foreground'>
                          Number of credits charged per token in the prompt
                          {field.value && (
                            <span className='block mt-1'>
                              Cost per million tokens:{' '}
                              {calculateCostPerMillion(field.value, appSettings.currency)}
                            </span>
                          )}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='outputTokenToCreditCoefficient'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Output Token Credit Cost</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={0}
                            step='0.00001'
                            placeholder='Enter credit cost per output token'
                            {...field}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <p className='text-xs text-muted-foreground'>
                          Number of credits charged per token in the response
                          {field.value && (
                            <span className='block mt-1'>
                              Cost per million tokens:{' '}
                              {calculateCostPerMillion(field.value, appSettings.currency)}
                            </span>
                          )}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <SheetFooter>
              <Button type='submit' className='w-full'>
                {props.mode === 'edit' ? 'Update' : 'Save'} Provider
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export const AIProviderFormTrigger = SheetTrigger
