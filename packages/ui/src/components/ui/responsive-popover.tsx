'use client'

import { DrawerTrigger, DrawerContent, DrawerClose, Drawer } from '@bulkit/ui/components/ui/drawer'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@bulkit/ui/components/ui/popover'
import { createResponsiveComponent } from '@bulkit/ui/utils/responsive.utils'
import { PopoverClose } from '@radix-ui/react-popover'

const ResponsivePopover = createResponsiveComponent('ResponsivePopover', Popover, Drawer, true)
const ResponsivePopoverTrigger = createResponsiveComponent(
  'ResponsivePopoverTrigger',
  PopoverTrigger,
  DrawerTrigger
)
const ResponsivePopoverContent = createResponsiveComponent(
  'ResponsivePopoverContent',
  PopoverContent,
  DrawerContent
)
const ResponsivePopoverClose = createResponsiveComponent(
  'ResponsivePopoverClose',
  PopoverClose,
  DrawerClose
)

const ResponsivePopoverAnchor = createResponsiveComponent(
  'ResponsivePopoverAnchor',
  PopoverAnchor,
  undefined
)

export {
  ResponsivePopover,
  ResponsivePopoverClose,
  ResponsivePopoverContent,
  ResponsivePopoverTrigger,
  ResponsivePopoverAnchor,
}
