"use client";

import { Badge } from "@bulkit/ui/components/ui/badge";
import { Button } from "@bulkit/ui/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@bulkit/ui/components/ui/collapsible";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
} from "@bulkit/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
	PiCaretRight,
	PiFile,
	PiFolder,
	PiFolderOpen,
	PiPlus,
	PiUploadSimple,
} from "react-icons/pi";

// Mock data structure - replace with real API data
const mockFolderTree = [
	{
		id: "root",
		name: "Root",
		type: "folder",
		children: [
			{
				id: "folder-1",
				name: "Marketing Assets",
				type: "folder",
				children: [
					{ id: "file-1", name: "Logo.png", type: "file" },
					{ id: "file-2", name: "Brand Guidelines.pdf", type: "file" },
				],
			},
			{
				id: "folder-2",
				name: "Project Files",
				type: "folder",
				children: [
					{ id: "file-3", name: "Proposal.docx", type: "file" },
					{ id: "file-4", name: "Budget.xlsx", type: "file" },
					{
						id: "folder-3",
						name: "Archived",
						type: "folder",
						children: [{ id: "file-5", name: "Old Project.zip", type: "file" }],
					},
				],
			},
			{ id: "file-6", name: "Notes.txt", type: "file" },
		],
	},
];

type TreeItem = {
	id: string;
	name: string;
	type: "file" | "folder";
	children?: TreeItem[];
};

function TreeNode({ item, level = 0 }: { item: TreeItem; level?: number }) {
	const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand first 2 levels
	const pathname = usePathname();

	if (item.type === "file") {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					asChild
					className="pl-6"
					style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
				>
					<Link href={`/files?file=${item.id}`}>
						<PiFile className="!size-4" />
						<span className="truncate">{item.name}</span>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						className="pl-6"
						style={{ paddingLeft: `${level * 16 + 8}px` }}
					>
						<PiCaretRight
							className={`!size-4 transition-transform ${
								isOpen ? "rotate-90" : ""
							}`}
						/>
						{isOpen ? (
							<PiFolderOpen className="!size-4" />
						) : (
							<PiFolder className="!size-4" />
						)}
						<span className="truncate">{item.name}</span>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{item.children?.map((child) => (
							<TreeNode key={child.id} item={child} level={level + 1} />
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}

export function FilesTreeSidebar() {
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<>
			<SidebarHeader className="border-b p-4">
				<div className="flex items-center justify-between mb-3">
					<h2 className="font-semibold text-base">Files Explorer</h2>
					<div className="flex gap-1">
						<Button size="sm" variant="ghost" className="h-7 w-7 p-0">
							<PiPlus className="h-4 w-4" />
						</Button>
						<Button size="sm" variant="ghost" className="h-7 w-7 p-0">
							<PiUploadSimple className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<SidebarInput
					placeholder="Search files..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="px-4">
						Folder Structure
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{mockFolderTree[0]?.children?.map((item) => (
								<TreeNode key={item.id} item={item} />
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Recent Files */}
				<SidebarGroup>
					<SidebarGroupLabel className="px-4">Recent Files</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/files?file=recent-1">
										<PiFile className="!size-4" />
										<span className="truncate">Presentation.pptx</span>
										<Badge variant="secondary" className="ml-auto text-xs">
											2m
										</Badge>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/files?file=recent-2">
										<PiFile className="!size-4" />
										<span className="truncate">Meeting Notes.md</span>
										<Badge variant="secondary" className="ml-auto text-xs">
											1h
										</Badge>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/files?file=recent-3">
										<PiFile className="!size-4" />
										<span className="truncate">Data Analysis.xlsx</span>
										<Badge variant="secondary" className="ml-auto text-xs">
											3h
										</Badge>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</>
	);
}
