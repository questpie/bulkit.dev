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
import {
	PiAt,
	PiBookOpen,
	PiCalendar,
	PiChartPie,
	PiKanban,
	PiPaperPlane,
} from "react-icons/pi";

const mainNavItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: PiChartPie,
	},
	{
		title: "Kanban",
		url: "/tasks",
		icon: PiKanban,
	},
	{
		title: "Calendar",
		url: "/calendar",
		icon: PiCalendar,
	},
	{
		title: "Channels",
		url: "/channels",
		icon: PiAt,
	},
	{
		title: "Posts",
		url: "/posts",
		icon: PiPaperPlane,
	},
	{
		title: "Knowledge",
		url: "/knowledge",
		icon: PiBookOpen,
	},
];

type NavMainProps = {
	isCollapsed?: boolean;
};

export function NavMain({ isCollapsed = false }: NavMainProps) {
	const pathname = usePathname();

	return (
		<SidebarGroup>
			{!isCollapsed && <SidebarGroupLabel>Platform</SidebarGroupLabel>}
			<SidebarMenu>
				{mainNavItems.map((item) => (
					<SidebarMenuItem key={item.title}>
						<SidebarMenuButton
							asChild
							isActive={
								pathname === item.url ||
								(item.url !== "/" && pathname.startsWith(item.url))
							}
							tooltip={item.title}
						>
							<Link href={item.url}>
								<item.icon className="!size-4" />
								<span>{item.title}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
