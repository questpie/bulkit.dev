"use client";

import { Badge } from "@bulkit/ui/components/ui/badge";
import { Button } from "@bulkit/ui/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarProvider,
} from "@bulkit/ui/components/ui/sidebar";
import { cn } from "@bulkit/ui/lib";
import { atom, useAtom } from "jotai";
import { MessageSquare } from "lucide-react";

export const rightSidebarAtom = atom(true);

export function RightSidebar() {
	const [open, setOpen] = useAtom(rightSidebarAtom);
	return (
		<SidebarProvider
			className="w-auto h-screen"
			open={open}
			onOpenChange={setOpen}
			style={
				{
					"--sidebar-width": "350px",
				} as React.CSSProperties
			}
		>
			<Sidebar
				side="right"
				collapsible="offcanvas"
				className={cn("h-full overflow-hidden")}
			>
				<SidebarHeader>
					<div className="flex items-center gap-2 px-2">
						<MessageSquare className="size-5" />
						<h2 className="font-semibold">Chat</h2>
						<Badge variant="secondary" className="ml-auto">
							Soon
						</Badge>
					</div>
				</SidebarHeader>

				<SidebarContent>
					<div className="flex flex-col items-center justify-center h-full text-center p-6">
						<div className="relative mb-6">
							<div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full blur-xl"></div>
							<div className="relative bg-gradient-to-r from-primary to-purple-600 rounded-full p-4">
								<MessageSquare className="size-8 text-white" />
							</div>
						</div>

						<h3 className="font-semibold text-xl mb-3">AI Chat</h3>
						<p className="text-sm text-muted-foreground mb-6 leading-relaxed">
							Connect with your team in real-time. Share ideas, collaborate on
							projects, and stay in sync with instant messaging.
						</p>

						<div className="space-y-3 w-full max-w-xs">
							<Button className="w-full" size="sm">
								<MessageSquare className="size-4 mr-2" />
								Start Conversation
							</Button>
							<Button variant="outline" className="w-full" size="sm">
								Learn More
							</Button>
						</div>

						<div className="mt-8 text-xs text-muted-foreground space-y-1">
							<p>🚀 Help with your questions</p>
							<p>📁 Smart context</p>
							<p>🔔 Craft social media posts</p>
						</div>
					</div>
				</SidebarContent>

				<SidebarFooter>
					<div className="text-xs text-muted-foreground text-center px-2">
						AI Chat features in development
					</div>
				</SidebarFooter>
			</Sidebar>
		</SidebarProvider>
	);
}
