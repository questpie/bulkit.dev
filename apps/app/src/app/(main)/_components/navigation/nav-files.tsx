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
import { PiFolder, PiImages } from "react-icons/pi";

const filesNavItems = [
	{
		title: "Files",
		url: "/files",
		icon: PiFolder,
		needsNestedSidebar: true,
	},
	{
		title: "Media Library",
		url: "/media",
		icon: PiImages,
		needsNestedSidebar: false,
	},
];

type NavFilesProps = {
	isCollapsed?: boolean;
};

export function NavFiles({ isCollapsed = false }: NavFilesProps) {
	const pathname = usePathname();

	return (
		<SidebarGroup>
			{!isCollapsed && <SidebarGroupLabel>Files</SidebarGroupLabel>}
			<SidebarMenu>
				{filesNavItems.map((item) => {
					const isActive =
						pathname === item.url || pathname.startsWith(item.url);

					return (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								isActive={isActive}
								tooltip={item.title}
								// onClick={() => handleFilesClick(item)}
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
