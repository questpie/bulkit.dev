'use client'

import { type ButtonProps, Button } from '@bulkit/ui/components/ui/button'
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@bulkit/ui/components/ui/dialog'
import {
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
  DrawerDescription,
  Drawer,
} from '@bulkit/ui/components/ui/drawer'
import { Input } from '@bulkit/ui/components/ui/input'
import useControllableState from '@bulkit/ui/hooks/use-controllable-state'
import { cn } from '@bulkit/ui/lib'
import { createResponsiveComponent } from '@bulkit/ui/utils/responsive.utils'
import React, { type ComponentProps, type PropsWithChildren } from 'react'

const ResponsiveDialog = createResponsiveComponent('ResponsiveDialog', Dialog, Drawer, true)
const ResponsiveDialogTrigger = createResponsiveComponent(
  'ResponsiveDialogTrigger',
  DialogTrigger,
  DrawerTrigger
)
const ResponsiveDialogContent = createResponsiveComponent(
  'ResponsiveDialogContent',
  DialogContent,
  DrawerContent
)
const ResponsiveDialogHeader = createResponsiveComponent(
  'ResponsiveDialogHeader',
  DialogHeader,
  DrawerHeader
)
const ResponsiveDialogTitle = createResponsiveComponent(
  'ResponsiveDialogTitle',
  DialogTitle,
  DrawerTitle
)
const ResponsiveDialogClose = createResponsiveComponent(
  'ResponsiveDialogClose',
  DialogClose,
  DrawerClose
)
const ResponsiveDialogFooter = createResponsiveComponent(
  'ResponsiveDialogFooter',
  DialogFooter,
  DrawerFooter
)
const ResponsiveDialogDescription = createResponsiveComponent(
  'ResponsiveDialogDescription',
  DialogDescription,
  DrawerDescription
)

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}

export function ResponsiveConfirmDialog(
  props: PropsWithChildren<ComponentProps<typeof ResponsiveDialog>> & {
    title: React.ReactNode
    content: React.ReactNode
    confirmLabel: string
    cancelLabel: string

    repeatText?: string

    onConfirm?: () => Promise<boolean>
    variant?: ButtonProps['variant']
  }
) {
  const [confirmText, setConfirmText] = React.useState('')
  const [isConfirmError, setIsConfirmError] = React.useState(false)

  const [open, setOpen] = useControllableState({
    value: props.open,
    defaultValue: false,
    onChange: props.onOpenChange,
  })
  const [isClosing, setIsClosing] = React.useState(false)

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      {props.children}
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{props.title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{props.content}</ResponsiveDialogDescription>

          {props.repeatText && (
            <div className='gap-y flex flex-col gap-4'>
              <p className='text-sm text-muted-foreground'>
                Please type <strong>{props.repeatText}</strong> to confirm
              </p>
              <Input
                value={confirmText}
                onChange={(e) => {
                  const text = e.target.value
                  setConfirmText(text)

                  if (isConfirmError && text === props.repeatText) {
                    setIsConfirmError(false)
                  }
                }}
                placeholder='Type the confirmation text'
              />
              <p
                className={cn(
                  'text-sm text-destructive opacity-100 transition-opacity duration-200',
                  !isConfirmError && 'opacity-0'
                )}
              >
                The text doesn't match. Please try again.
              </p>
            </div>
          )}
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <Button
            variant={props.variant ?? 'destructive'}
            disabled={!!isConfirmError && !!props.repeatText}
            onClick={async (e) => {
              if (props.repeatText && confirmText !== props.repeatText) {
                setIsConfirmError(true)
                e.preventDefault()
                e.stopPropagation()
                return
              }
              setIsClosing(true)
              const shouldClose = await props.onConfirm?.().finally(() => {
                setIsClosing(false)
              })
              if (shouldClose) {
                setOpen(false)
              }
            }}
            isLoading={isClosing}
          >
            {props.confirmLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
