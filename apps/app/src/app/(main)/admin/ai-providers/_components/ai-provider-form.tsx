'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { aiProvidersQueryOptions } from '@bulkit/app/app/(main)/admin/ai-providers/ai-providers.queries'
import {
  AddAIProviderSchema,
  UpdateAIProviderSchema,
  type AddAIProvider,
  type UpdateAIProvider,
} from '@bulkit/shared/modules/admin/schemas/ai-providers.schemas'
import { AI_TEXT_PROVIDER_TYPES } from '@bulkit/shared/modules/app/app-constants'
import { Button } from '@bulkit/ui/components/ui/button'
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
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
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
  defaultValues?: Partial<AddAIProvider>
  mode?: 'add' | 'edit'
}

export function AIProviderForm(props: PropsWithChildren<AIProviderFormProps>) {
  const [open, setOpen] = useControllableState({
    defaultValue: props.open ?? false,
    onChange: props.onOpenChange,
    value: props.open,
  })

  const form = useForm<UpdateAIProvider | AddAIProvider>({
    resolver: typeboxResolver(props.mode === 'edit' ? UpdateAIProviderSchema : AddAIProviderSchema),
    defaultValues: props.defaultValues || {
      name: 'anthropic',
      model: '',
    },
  })

  const queryClient = useQueryClient()

  const editMutation = useMutation({
    mutationFn: async (values: UpdateAIProvider) => {
      const response = await apiClient.admin['ai-providers'].index.put({
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
      const response = await apiClient.admin['ai-providers'].index.post(values)
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
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      {props.children}

      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {props.mode === 'edit' ? 'Edit' : 'Add'} AI Provider
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
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

            <Button type='submit' className='w-full'>
              {props.mode === 'edit' ? 'Update' : 'Save'} Provider
            </Button>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export const AIProviderFormTrigger = ResponsiveDialogTrigger
