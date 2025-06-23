"use client";

import { FilesTreeSidebar } from "@bulkit/app/app/(main)/_components/files-tree-sidebar";
import { AdminNestedSidebar } from "@bulkit/app/app/(main)/_components/navigation/nav-admin";
import { OrganizationNestedSidebar } from "@bulkit/app/app/(main)/_components/navigation/nav-organization";
import {
	SidebarProvider as ShadcnSidebarProvider,
	Sidebar,
	SidebarInset,
} from "@bulkit/ui/components/ui/sidebar";
import { usePathname } from "next/navigation";
import type { ComponentType, PropsWithChildren } from "react";
import { LeftSidebar } from "./left-sidebar";
import { MainHeader } from "./main-header";
import { RightSidebar } from "./right-sidebar";

type AppLayoutProps = PropsWithChildren<{
	className?: string;
}>;

const pathPrefixBySidebar: { prefix: string; sidebar: ComponentType }[] = [
	{
		prefix: "/files",
		sidebar: FilesTreeSidebar,
	},
	{
		prefix: "/organizations",
		sidebar: OrganizationNestedSidebar,
	},
	{
		prefix: "/admin",
		sidebar: AdminNestedSidebar,
	},
];

export function AppLayout({ children, className }: AppLayoutProps) {
	const pathname = usePathname();

	const NestedSidebar =
		pathPrefixBySidebar.find(({ prefix }) => pathname.startsWith(prefix))
			?.sidebar || null;

	return (
		<ShadcnSidebarProvider
			// open={!NestedSidebar}
			className="transition-[width]"
			style={
				{
					"--sidebar-width": NestedSidebar ? "350px" : "300px",
				} as React.CSSProperties
			}
		>
			<Sidebar
				className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
				collapsible="icon"
			>
				{/* Main left sidebar - collapses when nested sidebar is active */}
				<LeftSidebar isCollapsed={!!NestedSidebar} />
				{/* Dynamic nested sidebar - content controlled by individual pages */}
				<Sidebar collapsible="none" className="hidden flex-1 md:flex">
					{NestedSidebar && <NestedSidebar />}
				</Sidebar>
			</Sidebar>

			{/* Main content area */}
			<SidebarInset className="flex flex-col">
				<MainHeader />
				{/* <main className={cn("flex-1 overflow-auto p-6", className)}> */}
				{children}
				{/* </main> */}
			</SidebarInset>

			<RightSidebar />
		</ShadcnSidebarProvider>
	);
}
