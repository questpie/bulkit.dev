'use client'
import type { Resource } from '@bulkit/api/modules/resources/resources.dal'
import { apiClient } from '@bulkit/app/api/api.client'
import { Button } from '@bulkit/ui/components/ui/button'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { LuUploadCloud } from 'react-icons/lu'

type PostMediaFieldProps = {
  onUploaded?: (resources: Resource[]) => void
  allowedTypes?: string[]
  maxFiles?: number
  maxSize?: number // in bytes

  variant?: 'dropzone' | 'button'
}
export function ResourceUploader({
  onUploaded,
  allowedTypes = ['image/*', 'video/*', 'audio/*'],
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  variant = 'dropzone',
}: PostMediaFieldProps) {
  const mutation = useMutation({
    mutationFn: (...args: Parameters<typeof apiClient.resources.index.post>) =>
      apiClient.resources.index.post(...args).then((res) => {
        if (res.error) {
          throw new Error(res.error.value.message)
        }

        return res.data
      }),
    onSuccess: (data) => {
      onUploaded?.(data)
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        toast.promise(
          mutation.mutateAsync({
            files: acceptedFiles as any,
          }),
          {
            loading: 'Uploading files...',
            success: 'Files uploaded',
            error: (err) => err.message,
          }
        )
      },
      [mutation]
    ),
    accept: allowedTypes.reduce(
      (acc, type) => {
        acc[type] = []
        return acc
      },
      {} as Record<string, string[]>
    ),
    maxSize,
    maxFiles: maxFiles,
  })

  // TODO: add a middle step which opens a dialog, shows the selected file and lets you either cancel or upload

  if (variant === 'button') {
    return (
      <>
        <input {...getInputProps()} />
        <Button
          {...getRootProps()}
          className={cn(isDragActive && 'bg-primary/20 text-primary border-primary border')}
        >
          <LuUploadCloud />
          {isDragActive ? <>Drop here...</> : <>Upload files</>}
        </Button>
      </>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 transition text-muted-foreground duration-200 flex flex-col gap-4 hover:bg-accent/50 border-dashed border-border rounded-xl p-5 text-center cursor-pointer',
        isDragActive && 'bg-primary/20 border-primary text-primary'
      )}
    >
      <LuUploadCloud className='h-12 w-12 mx-auto' />

      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
    </div>
  )
}
