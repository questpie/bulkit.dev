"use client";

import { rightSidebarAtom } from "@bulkit/app/app/(main)/_components/right-sidebar";
import { Button } from "@bulkit/ui/components/ui/button";
import { Input } from "@bulkit/ui/components/ui/input";
import { Separator } from "@bulkit/ui/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@bulkit/ui/components/ui/sidebar";
import { useAtom } from "jotai";
import { PanelRight, Search } from "lucide-react";
import { useState } from "react";

export function MainHeader() {
	const [searchQuery, setSearchQuery] = useState("");
	const { toggleSidebar } = useSidebar();

	const [rightSidebar, setRightSidebar] = useAtom(rightSidebarAtom);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement global search functionality
		console.log("Search query:", searchQuery);
	};

	return (
		<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
			<div className="flex items-center gap-2 px-4 w-full">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 h-4" />

				{/* Search Bar */}
				<form onSubmit={handleSearch} className="flex-1 max-w-md">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search everything..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className={{
								wrapper: "pl-10",
							}}
						/>
					</div>
				</form>

				<div className="ml-auto flex items-center gap-2">
					{/* Right Sidebar Toggle */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => {
							setRightSidebar(!rightSidebar);
						}}
						className="h-7 w-7"
					>
						<PanelRight className="h-4 w-4" />
						<span className="sr-only">Toggle right sidebar</span>
					</Button>
				</div>
			</div>
		</header>
	);
}
