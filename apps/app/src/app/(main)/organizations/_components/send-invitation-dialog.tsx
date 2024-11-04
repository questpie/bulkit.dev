'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { useSelectedOrganization } from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { SendInvitationSchema } from '@bulkit/shared/modules/organizations/organizations.schemas'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
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
import type { Static } from '@sinclair/typebox'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'

type SendInvitationFormValues = Static<typeof SendInvitationSchema>

export function OrganizationSendInviteDialog(
  props: PropsWithChildren<{ open?: boolean; onOpenChange?: (open: boolean) => void }>
) {
  const [open, onOpenChange] = useControllableState({
    value: props.open,
    defaultValue: props.open ?? false,
    onChange: props.onOpenChange,
  })

  const selectedOrg = useSelectedOrganization()

  if (!selectedOrg) {
    throw new Error('OrganizationSendInviteDialog must be used within a OrganizationProvider')
  }

  const router = useRouter()
  const form = useForm<SendInvitationFormValues>({
    resolver: typeboxResolver(SendInvitationSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: SendInvitationFormValues) =>
      apiClient.organizations({ id: selectedOrg.id }).invite.post([
        {
          email: data.email,
          role: data.role,
        },
      ]),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error.value.message ?? 'Something went wrong')
        return
      }
      toast.success('Invitation sent successfully')
      form.reset()
      router.refresh()
      onOpenChange(false)
    },
  })

  const onSubmit = (data: SendInvitationFormValues) => {
    mutation.mutate(data)
  }

  const denied = useSearchParams().get('denied')
  if (denied) {
    toast.error('Authorization denied', {
      id: 'auth-denied',
    })
    router.replace('/channels')
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          form.reset()
        }
        onOpenChange(newOpen)
      }}
    >
      {props.children}
      <ResponsiveDialogContent className='px-4 pb-4'>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Send Invitation</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-8'>
            <div className='flex flex-col gap-4'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter email' {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the email address of the person you want to invite.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='member'>Member</SelectItem>
                        <SelectItem value='admin'>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the role for the invited user.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type='submit'
              isLoading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitSuccessful}
            >
              {form.formState.isSubmitting
                ? 'Sending...'
                : form.formState.isSubmitSuccessful
                  ? 'Invitation sent'
                  : 'Send Invitation'}
            </Button>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export const OrganizationSendInviteDialogTrigger = ResponsiveDialogTrigger
