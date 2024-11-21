'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { setOrganization } from '@bulkit/app/app/(main)/organizations/organization.actions'
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
  const router = useRouter()

  const form = useForm<Static<typeof CreateOrganizationSchema>>({
    resolver: typeboxResolver(CreateOrganizationSchema),
    defaultValues: {
      name: `${auth!.user.name}'s Organization`,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: Static<typeof CreateOrganizationSchema>) => {
      const resp = await apiClient.organizations.index.post(data)
      if (resp.error) {
        throw new Error(resp.error.value.message)
      }
      await setOrganization(resp.data.id)
      return resp.data
    },
    onSuccess: () => {
      router.push('/onboarding/plan')
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    return toast.promise(mutation.mutateAsync(data), {
      loading: 'Creating organization...',
      success: "Organization created! Let's select a plan.",
      error: 'Failed to create organization',
    })
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <FormField
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <Input {...field} autoFocus />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' isLoading={form.formState.isSubmitting}>
          Create Organization
        </Button>
      </form>
    </Form>
  )
}
