'use client'
import { toast } from '@bulkit/ui/components/ui/sonner'

import { apiClient } from '@bulkit/app/api/api.client'
import { sessionsQueryOptions } from '@bulkit/app/app/(main)/profile/sessions/sessions.queries'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  ResponsiveConfirmDialog,
  ResponsiveConfirmDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function RemoveAllSessionsButton() {
  const queryClient = useQueryClient()

  const removeAll = useMutation({
    mutationFn: () =>
      apiClient.auth.session.revoke.delete(undefined, {
        query: {},
      }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error.value.message ?? 'Something went wrong')
        return
      }

      queryClient.invalidateQueries({ queryKey: sessionsQueryOptions({}).queryKey })
      window.location.reload()
      toast.success('All sessions have been revoked')
    },
  })

  return (
    <ResponsiveConfirmDialog
      title='Revoke All Sessions'
      content='Are you sure you want to revoke all sessions? You will be logged out of all devices. This action cannot be undone.'
      confirmLabel='Revoke'
      cancelLabel='Cancel'
    >
      <ResponsiveConfirmDialogTrigger asChild>
        <Button
          onClick={() => removeAll.mutate()}
          variant='destructive'
          disabled={removeAll.isPending}
        >
          Revoke All Sessions
        </Button>
      </ResponsiveConfirmDialogTrigger>
    </ResponsiveConfirmDialog>
  )
}
