"use client";

import { Badge } from "@bulkit/ui/components/ui/badge";
import { Button } from "@bulkit/ui/components/ui/button";
import {
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@bulkit/ui/components/ui/sidebar";
import { Bell } from "lucide-react";
import { ProfileDropdown } from "../profile-dropdown";

type NavUserProps = {
	isCollapsed?: boolean;
};

export function NavUser({ isCollapsed = false }: NavUserProps) {
	// Mock unread notification count - replace with real API call later
	const unreadNotifications = 3;

	const handleNotificationsClick = () => {
		// TODO: Implement notifications panel/page
		console.log("Notifications clicked");
	};

	if (isCollapsed) {
		return (
			<div className="flex flex-col gap-2">
				{/* Notifications Button - Icon Only */}
				<Button
					variant="ghost"
					size="icon"
					onClick={handleNotificationsClick}
					className="relative h-8 w-8"
				>
					<Bell className="h-4 w-4" />
					{unreadNotifications > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
						>
							{unreadNotifications > 9 ? "9+" : unreadNotifications}
						</Badge>
					)}
				</Button>

				{/* Profile - Collapsed Version */}
				<ProfileDropdown isCollapsed={true} />
			</div>
		);
	}

	return (
		<SidebarMenu>
			{/* Notifications Button */}
			<SidebarMenuItem>
				<SidebarMenuButton
					onClick={handleNotificationsClick}
					tooltip="Notifications"
				>
					<Bell className="!size-4" />
					<span>Notifications</span>
					{unreadNotifications > 0 && (
						<SidebarMenuBadge>
							{unreadNotifications > 99 ? "99+" : unreadNotifications}
						</SidebarMenuBadge>
					)}
				</SidebarMenuButton>
			</SidebarMenuItem>

			{/* Profile Dropdown */}
			<SidebarMenuItem>
				<ProfileDropdown />
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
