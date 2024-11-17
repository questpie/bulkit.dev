import { Button, type ButtonProps } from '@bulkit/ui/components/ui/button'
import {
  ResponsiveDropdownMenu,
  ResponsiveDropdownMenuContent,
  ResponsiveDropdownMenuItem,
  ResponsiveDropdownMenuTrigger,
} from '@bulkit/ui/components/ui/responsive-dropdown'
import Link from 'next/link'
import { Fragment, useState } from 'react'
import { LuMoreVertical } from 'react-icons/lu'
import { ResponsiveConfirmDialog, ResponsiveDialogTrigger } from '../responsive-dialog'

type TableActionsProps<T> = {
  actions: TableActions<T>
  row: T
}

type TableActionBase<T> = {
  label: string
  icon?: React.ReactNode
  show?: boolean
  variant?: ButtonProps['variant']
}

type TableActionWithHref<T> = TableActionBase<T> & {
  href: string
  onClick?: never
}

type TableActionWithClick<T> = TableActionBase<T> & {
  href?: never
  /**
   * if requiredConfirm is not provided, the action will be executed immediately
   * if requiredConfirm is provided, the action will be executed after confirmation
   */
  onClick: (row: T) => void | Promise<void>
  requireConfirm?: {
    title: string
    content: string
    confirmLabel?: string
    cancelLabel?: string
  }
}

type TableAction<T> = TableActionWithHref<T> | TableActionWithClick<T>

export type TableActions<T> = {
  primary?: TableAction<T>
  options?: TableAction<T>[]
}

export function ActionButton<T>({ action, row }: { action: TableAction<T>; row: T }) {
  if ('href' in action) {
    const href = action.href
    return (
      <Button
        variant={action.variant}
        className='flex items-center px-2 sm:px-4 h-8 sm:h-9 gap-1 sm:gap-2 w-full justify-start text-xs sm:text-sm'
        asChild
      >
        <Link href={href!}>
          {action.icon}
          <span className='truncate'>{action.label}</span>
        </Link>
      </Button>
    )
  }

  if (action.requireConfirm) {
    return (
      <ResponsiveConfirmDialog
        title={action.requireConfirm.title}
        content={action.requireConfirm.content}
        confirmLabel={action.requireConfirm.confirmLabel ?? 'Confirm'}
        cancelLabel={action.requireConfirm.cancelLabel ?? 'Cancel'}
        onConfirm={async () => (await action.onClick(row)) ?? true}
      >
        <ResponsiveDialogTrigger asChild>
          <Button
            variant={action.variant}
            className='flex items-center gap-1 sm:gap-2 w-full justify-start text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4'
          >
            {action.icon}
            {action.label}
          </Button>
        </ResponsiveDialogTrigger>
      </ResponsiveConfirmDialog>
    )
  }

  return (
    <Button
      variant={action.variant}
      className='flex items-center gap-2 w-full justify-start h-8 sm:h-9 px-2 sm:px-4'
      onClick={() => action.onClick(row)}
    >
      {action.icon}
      {action.label}
    </Button>
  )
}

export function TableActions<T>(props: TableActionsProps<T>) {
  const visibleOptions = props.actions.options?.filter((action) => action.show) ?? []
  if (!props.actions.primary && !visibleOptions.length) return null

  const [activeRequireConfirm, setActiveRequireConfirm] = useState<
    TableActionWithClick<T> | undefined
  >(undefined)

  console.log('activeRequireConfirm', activeRequireConfirm)

  return (
    <>
      <div className='flex items-center gap-2'>
        {props.actions.primary && (
          <div className='flex-1'>
            <ActionButton action={props.actions.primary} row={props.row} />
          </div>
        )}
        {visibleOptions.length > 0 && (
          <ResponsiveDropdownMenu>
            <ResponsiveDropdownMenuTrigger asChild>
              <Button variant='outline' size='icon' className='size-8 sm:size-9'>
                <LuMoreVertical className='h-4 w-4' />
                <span className='sr-only'>Open menu</span>
              </Button>
            </ResponsiveDropdownMenuTrigger>
            <ResponsiveDropdownMenuContent align='end'>
              {visibleOptions.map((action, index) => {
                const Wrapper = action.href ? Link : Fragment
                const wrapperProps = (action.href ? { href: action.href } : {}) as any
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  <Wrapper {...wrapperProps} key={index}>
                    <ResponsiveDropdownMenuItem
                      className={action.variant === 'destructive' ? 'text-destructive' : undefined}
                      onClick={() => {
                        if ('requireConfirm' in action && action.requireConfirm) {
                          setActiveRequireConfirm(action as TableActionWithClick<T>)
                        } else {
                          action.onClick?.(props.row)
                        }
                      }}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </ResponsiveDropdownMenuItem>
                  </Wrapper>
                )
              })}
            </ResponsiveDropdownMenuContent>
          </ResponsiveDropdownMenu>
        )}
      </div>
      {activeRequireConfirm && (
        <ResponsiveConfirmDialog
          open={!!activeRequireConfirm}
          onOpenChange={(open) => !open && setActiveRequireConfirm(undefined)}
          title={activeRequireConfirm.requireConfirm!.title}
          content={activeRequireConfirm.requireConfirm!.content}
          confirmLabel={activeRequireConfirm.requireConfirm!.confirmLabel ?? 'Confirm'}
          cancelLabel={activeRequireConfirm.requireConfirm!.cancelLabel ?? 'Cancel'}
          onConfirm={async () => {
            await activeRequireConfirm.onClick(props.row)
            setActiveRequireConfirm(undefined)
            return true
          }}
        />
      )}
    </>
  )
}
