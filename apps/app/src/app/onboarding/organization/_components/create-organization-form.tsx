'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { setOrganization } from '@bulkit/app/app/onboarding/organization/organization.actions'
import { Button } from '@bulkit/ui/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@bulkit/ui/components/ui/form'
import { Input } from '@bulkit/ui/components/ui/input'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Type, type Static } from '@sinclair/typebox'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

export const CreateOrganizationSchema = Type.Object({
  name: Type.String(),
})

export function CreateOrganizationForm() {
  const auth = useAuthData()
  const form = useForm<Static<typeof CreateOrganizationSchema>>({
    resolver: typeboxResolver(CreateOrganizationSchema),
    defaultValues: {
      name: `${auth!.user.name}'s Organization`,
    },
  })

  const router = useRouter()
  const mutation = useMutation({
    mutationFn: async (...args: Parameters<typeof apiClient.organizations.index.post>) => {
      const resp = await apiClient.organizations.index.post(...args)
      if (resp.error) {
        throw new Error(resp.error.value.message)
      }

      await setOrganization(resp.data.id)

      return resp.data
    },
    onSuccess: () => {
      router.push('/')
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    return toast.promise(mutation.mutateAsync({ name: data.name }), {
      loading: 'Creating organization...',
      success: 'Organization created!',
      error: 'Failed to create organization',
    })
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
        <FormField
          name='name'
          render={({ field }) => {
            return (
              <FormItem className='flex flex-col'>
                <FormLabel>Organization Name</FormLabel>
                <Input {...field} placeholder='Organization Name' />
                <FormMessage />
              </FormItem>
            )
          }}
        />
        <Button type='submit' isLoading={form.formState.isSubmitting}>
          Create Organization
        </Button>
      </form>
    </Form>
  )
}
