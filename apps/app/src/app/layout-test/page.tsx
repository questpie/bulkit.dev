import { AppLayout } from "@bulkit/app/app/(main)/_components/app-layout";
import { StandardPage } from "@bulkit/app/app/(main)/_components/page-templates";
import { Button } from "@bulkit/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@bulkit/ui/components/ui/card";
import Link from "next/link";

export default function LayoutTestPage() {
	return (
		<AppLayout>
			<StandardPage
				title="Layout System Test"
				description="Test the new dual-sidebar layout system with different page types"
				breadcrumbs={[{ href: "/", label: "Home" }, { label: "Layout Test" }]}
				actions={
					<Button asChild>
						<Link href="/">Back to Main App</Link>
					</Button>
				}
			>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{/* Standard Page Test */}
					<Card>
						<CardHeader>
							<CardTitle>Standard Page</CardTitle>
							<CardDescription>
								Basic page template with title, description, and actions
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className="w-full">
								<Link href="/layout-test/standard">View Standard Page</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Dashboard Page Test */}
					<Card>
						<CardHeader>
							<CardTitle>Dashboard Page</CardTitle>
							<CardDescription>
								Dashboard template with stats cards and metrics
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className="w-full">
								<Link href="/layout-test/dashboard">View Dashboard</Link>
							</Button>
						</CardContent>
					</Card>

					{/* List Page Test */}
					<Card>
						<CardHeader>
							<CardTitle>List Page</CardTitle>
							<CardDescription>
								List template with filters and table data
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className="w-full">
								<Link href="/layout-test/list">View List Page</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Files Test */}
					<Card>
						<CardHeader>
							<CardTitle>Files Tree Test</CardTitle>
							<CardDescription>
								Test the dual-sidebar system with files tree
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className="w-full">
								<Link href="/layout-test/files">View Files Page</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Chat Sidebar Test */}
					<Card>
						<CardHeader>
							<CardTitle>Chat Sidebar</CardTitle>
							<CardDescription>
								Test the right sidebar chat placeholder
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className="w-full">
								<Link href="/layout-test/chat">View Chat Test</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Admin Test */}
					<Card>
						<CardHeader>
							<CardTitle>Admin Layout</CardTitle>
							<CardDescription>
								Test admin section visibility and navigation
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className="w-full">
								<Link href="/layout-test/admin">View Admin Test</Link>
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Layout Features */}
				<div className="mt-12">
					<h2 className="text-2xl font-bold mb-6">Layout Features</h2>
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Dual Sidebar System</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									<span className="text-sm">
										Main sidebar collapses to icons on files pages
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									<span className="text-sm">
										Files tree sidebar shows only on /files routes
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									<span className="text-sm">
										Right sidebar always visible for chat
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Navigation Structure</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									<span className="text-sm">Organization select at top</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									<span className="text-sm">Main navigation items</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									<span className="text-sm">Admin section (if admin)</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									<span className="text-sm">
										Notifications + Profile at bottom
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</StandardPage>
		</AppLayout>
	);
}
