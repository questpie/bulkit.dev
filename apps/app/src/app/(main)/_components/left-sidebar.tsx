"use client";

import { useAuthData } from "@bulkit/app/app/(auth)/use-auth";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	useSidebar,
} from "@bulkit/ui/components/ui/sidebar";
import { cn } from "@bulkit/ui/lib";
import { NavAdmin } from "./navigation/nav-admin";
import { NavFiles } from "./navigation/nav-files";
import { NavMain } from "./navigation/nav-main";
import { NavOrganization } from "./navigation/nav-organization";
import { NavUser } from "./navigation/nav-user";
import { OrganizationSelect } from "./organizations-select";

export function LeftSidebar(props: { isCollapsed: boolean }) {
	const authData = useAuthData();
	const isAdmin = !!authData?.user.isAdmin;

	const sidebar = useSidebar();

	const isCollapsed = props.isCollapsed || !sidebar.open;

	return (
		<Sidebar
			collapsible="none"
			className={cn(
				"border-r transition-all h-svh",
				isCollapsed && "w-[calc(var(--sidebar-width-icon)+1px)]! border-r",
				!isCollapsed && "w-[var(--sidebar-width)]",
			)}
		>
			<SidebarHeader className="border-b p-4">
				<div className="flex items-center gap-2">
					<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
						<span className="font-bold text-sm">B</span>
					</div>
					{!isCollapsed && (
						<div>
							<h1 className="text-lg font- font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
								bulkit.dev
							</h1>
						</div>
					)}
				</div>
				{!isCollapsed && (
					<div className="mt-4">
						<OrganizationSelect />
					</div>
				)}
			</SidebarHeader>

			<SidebarContent className="px-2">
				{/* Main Navigation */}
				<div>
					<NavMain isCollapsed={!!isCollapsed} />
				</div>

				{/* Files Section */}
				<NavFiles isCollapsed={!!isCollapsed} />

				{/* Organization Section */}
				<NavOrganization isCollapsed={!!isCollapsed} />

				{/* Admin Section - only show if user is admin */}
				{isAdmin && <NavAdmin isCollapsed={!!isCollapsed} />}
			</SidebarContent>

			<SidebarFooter className="border-t p-2">
				<NavUser isCollapsed={!!isCollapsed} />
			</SidebarFooter>
		</Sidebar>
	);
}
