'use client'
import type { Resource } from '@bulkit/api/modules/resources/services/resources.service'
import { apiClient } from '@bulkit/app/api/api.client'
import { Button } from '@bulkit/ui/components/ui/button'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { LuUploadCloud } from 'react-icons/lu'

type ResourceUploaderProps = {
  onUploaded?: (resources: Resource[]) => void
  allowedTypes?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
  disabled?: boolean
}

function useResourceUploader({
  onUploaded,
  allowedTypes = ['image/*', 'video/*', 'audio/*'],
  maxFiles = 10,
  maxSize = 1024 * 1024 * 1024, // 1024MB
  disabled,
}: ResourceUploaderProps) {
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

  const dropzone = useDropzone({
    disabled,
    onDropAccepted: useCallback(
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
    accept: allowedTypes?.reduce(
      (acc, type) => {
        acc[type] = []
        return acc
      },
      {} as Record<string, string[]>
    ),
    onDropRejected: (rejectedFiles) => {
      const uniqueErrorMessages = new Set<string>()
      for (const file of rejectedFiles) {
        for (const error of file.errors) {
          uniqueErrorMessages.add(error.message)
        }
      }
      const m = Array.from(uniqueErrorMessages).map((m, i) => (
        <>
          <span key={`${m}-span`}>{m}</span>
          <br key={`${m}-br`} />
        </>
      ))

      toast.error('Some files were rejected.', {
        description: m,
      })
    },
    maxSize,
    maxFiles,
  })

  return {
    ...dropzone,
    isUploading: mutation.isPending,
  }
}

export function ResourceDropzone(props: ResourceUploaderProps) {
  const { getRootProps, getInputProps, isDragActive } = useResourceUploader(props)
  // TODO: add a middle step which opens a dialog, shows the selected file and lets you either cancel or upload

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 text-sm transition text-muted-foreground duration-200 flex flex-col gap-4 hover:bg-accent/50 border-dashed border-border rounded-xl p-5 text-center cursor-pointer',
        isDragActive && 'bg-primary/20 border-primary text-primary',
        props.disabled && 'opacity-80 pointer-events-none'
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

export function ResourceButtonUpload(
  props: ResourceUploaderProps & {
    buttonProps?: React.ComponentProps<typeof Button>
  }
) {
  const { getRootProps, getInputProps, isDragActive, isUploading } = useResourceUploader(props)
  // TODO: add a middle step which opens a dialog, shows the selected file and lets you either cancel or upload

  return (
    <>
      <input {...getInputProps()} type='button' />
      <Button
        disabled={props.disabled}
        {...props.buttonProps}
        {...getRootProps()}
        type='button'
        role='button'
        isLoading={isUploading}
        loadingText='Uploading...'
        className={cn(
          'border',
          isDragActive && 'bg-primary/20 text-primary border-primary border',
          props.buttonProps?.className
        )}
      >
        <LuUploadCloud />
        {isDragActive ? <>Drop here...</> : <>Upload files</>}
      </Button>
    </>
  )
}
