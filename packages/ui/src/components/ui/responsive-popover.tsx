"use client";

import type { PopoverTriggerProps } from "@base-ui/react/popover";
import {
	DrawerTrigger,
	DrawerContent,
	DrawerClose,
	Drawer,
} from "@bulkit/ui/components/ui/drawer";
import {
	Popover,
	PopoverClose,
	PopoverContent,
	PopoverTrigger,
} from "@bulkit/ui/components/ui/popover";
import {
	createResponsiveComponent,
	type ResponsiveComponent,
} from "@bulkit/ui/utils/responsive.utils";
import type { ComponentProps } from "react";
// import { PopoverClose } from '@radix-ui/react-popover'

const ResponsivePopover = createResponsiveComponent(
	"ResponsivePopover",
	Popover,
	Drawer,
	true,
);
const ResponsivePopoverTrigger: ResponsiveComponent<
	PopoverTriggerProps,
	ComponentProps<typeof DrawerTrigger>
> = createResponsiveComponent(
	"ResponsivePopoverTrigger",
	PopoverTrigger,
	DrawerTrigger,
);
const ResponsivePopoverContent: ResponsiveComponent<
	ComponentProps<typeof PopoverContent>,
	ComponentProps<typeof DrawerContent>
> = createResponsiveComponent(
	"ResponsivePopoverContent",
	PopoverContent,
	DrawerContent,
);
const ResponsivePopoverClose: ResponsiveComponent<
	ComponentProps<typeof PopoverClose>,
	ComponentProps<typeof DrawerClose>
> = createResponsiveComponent(
	"ResponsivePopoverClose",
	PopoverClose,
	DrawerClose,
);

export {
	ResponsivePopover,
	ResponsivePopoverClose,
	ResponsivePopoverContent,
	ResponsivePopoverTrigger,
};
