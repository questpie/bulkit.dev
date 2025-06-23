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
	PiBuilding,
	PiCreditCard,
	PiGear,
	PiPaperPlaneTilt,
	PiUsers,
} from "react-icons/pi";

// import { useSidebar } from "../sidebar-context";

const organizationNavItems = [
	{
		title: "Organization",
		url: "/organizations",
		icon: PiBuilding,
	},
];

// Organization nested sidebar content
export function OrganizationNestedSidebar() {
	const pathname = usePathname();

	const orgSubItems = [
		{ title: "Overview", url: "/organizations", icon: PiBuilding },
		{ title: "Members", url: "/organizations/members", icon: PiUsers },
		{ title: "Settings", url: "/organizations/settings", icon: PiGear },
		{ title: "Billing", url: "/organizations/billing", icon: PiCreditCard },
		{ title: "Invites", url: "/organizations/invites", icon: PiPaperPlaneTilt },
	];

	return (
		<div className="w-full border-r bg-sidebar">
			<div className="p-4 border-b">
				<h2 className="text-sm font-semibold text-sidebar-foreground">
					Organization
				</h2>
			</div>
			<div className="p-2">
				{orgSubItems.map((item) => {
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

type NavOrganizationProps = {
	isCollapsed?: boolean;
};

export function NavOrganization({ isCollapsed = false }: NavOrganizationProps) {
	const pathname = usePathname();
	// const { setActiveNestedSidebar, setNestedSidebarContent } = useSidebar();

	// const handleOrganizationClick = () => {
	// 	setActiveNestedSidebar("organization");
	// 	setNestedSidebarContent(<OrganizationNestedSidebar />);
	// };

	return (
		<SidebarGroup>
			{!isCollapsed && <SidebarGroupLabel>Organization</SidebarGroupLabel>}
			<SidebarMenu>
				{organizationNavItems.map((item) => {
					const isActive =
						pathname === item.url || pathname.startsWith(item.url);

					return (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								isActive={isActive}
								tooltip={item.title}
								// onClick={handleOrganizationClick}
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
