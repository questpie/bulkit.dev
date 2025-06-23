"use client";

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@bulkit/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiDatabase, PiGear, PiShield, PiUsers } from "react-icons/pi";

// import { useSidebar } from "../sidebar-context";

const adminNavItems = [
	{
		title: "Administration",
		url: "/admin",
		icon: PiShield,
	},
];

// Admin nested sidebar content
export function AdminNestedSidebar() {
	const pathname = usePathname();

	const adminSubItems = [
		{ title: "Dashboard", url: "/admin", icon: PiShield },
		{ title: "Users", url: "/admin/users", icon: PiUsers },
		{ title: "Settings", url: "/admin/settings", icon: PiGear },
		{ title: "Database", url: "/admin/database", icon: PiDatabase },
	];

	return (
		<div className="w-full border-r bg-sidebar">
			<div className="p-4 border-b">
				<h2 className="text-sm font-semibold text-sidebar-foreground">
					Administration
				</h2>
			</div>
			<div className="p-2">
				{adminSubItems.map((item) => {
					const isActive =
						pathname === item.url || pathname.startsWith(item.url);
					return (
						<Link
							key={item.title}
							href={item.url}
							className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent ${
								isActive
									? "bg-sidebar-accent text-sidebar-accent-foreground"
									: "text-sidebar-foreground"
							}`}
						>
							<item.icon className="w-4 h-4" />
							{item.title}
						</Link>
					);
				})}
			</div>
		</div>
	);
}

type NavAdminProps = {
	isCollapsed?: boolean;
};

export function NavAdmin({ isCollapsed = false }: NavAdminProps) {
	const pathname = usePathname();

	return (
		<SidebarGroup>
			{!isCollapsed && <SidebarGroupLabel>Admin</SidebarGroupLabel>}
			<SidebarMenu>
				{adminNavItems.map((item) => {
					const isActive =
						pathname === item.url || pathname.startsWith(item.url);

					return (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								isActive={isActive}
								tooltip={item.title}
							>
								<Link href={item.url}>
									<item.icon className="!size-4" />
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
