import { AppLayout } from "@bulkit/app/app/(main)/_components/app-layout";
import { StandardPage } from "@bulkit/app/app/(main)/_components/page-templates";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@bulkit/ui/components/ui/alert";
import { Badge } from "@bulkit/ui/components/ui/badge";
import { Button } from "@bulkit/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@bulkit/ui/components/ui/card";
import Link from "next/link";
import {
	PiArrowLeft,
	PiGear,
	PiShield,
	PiUsers,
	PiWarning,
} from "react-icons/pi";

export default function AdminPageTest() {
	return (
		<AppLayout>
			<StandardPage
				title="Admin Navigation Test"
				description="This page demonstrates how admin navigation appears in the sidebar for users with admin privileges."
				breadcrumbs={[
					{ href: "/layout-test", label: "Layout Test" },
					{ label: "Admin Test" },
				]}
				actions={
					<div className="flex gap-2">
						<Button variant="outline" size="sm">
							System Status
						</Button>
						<Button size="sm">Admin Panel</Button>
					</div>
				}
			>
				<div className="space-y-6">
					{/* Admin Access Info */}
					<Alert>
						<PiShield className="h-4 w-4" />
						<AlertTitle>Admin Access Required</AlertTitle>
						<AlertDescription>
							The admin navigation section in the left sidebar is only visible
							to users with admin privileges. Check your user role and
							permissions to see the admin section.
						</AlertDescription>
					</Alert>

					{/* Admin Features */}
					<Card className="border-orange-200 bg-orange-50/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<PiShield className="w-5 h-5 text-orange-600" />
								Admin Navigation Features
								<Badge variant="secondary">Admin Only</Badge>
							</CardTitle>
							<CardDescription>
								What admin users can see and access in the navigation
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-3 md:grid-cols-2">
								<div className="space-y-2">
									<h4 className="font-medium text-orange-900">
										Visibility Logic:
									</h4>
									<ul className="text-sm space-y-1">
										<li>• Only shown if user.isAdmin is true</li>
										<li>• Filtered out for regular users</li>
										<li>• Simple button (not submenu)</li>
										<li>• Opens admin page directly</li>
									</ul>
								</div>
								<div className="space-y-2">
									<h4 className="font-medium text-orange-900">
										Admin Capabilities:
									</h4>
									<ul className="text-sm space-y-1">
										<li>• User management</li>
										<li>• System configuration</li>
										<li>• Analytics and reports</li>
										<li>• Security settings</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Mock Admin Dashboard */}
					<div className="grid gap-6 md:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<PiUsers className="w-5 h-5" />
									User Management
								</CardTitle>
								<CardDescription>
									Manage user accounts and permissions
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
										<div>
											<p className="font-medium text-sm">Total Users</p>
											<p className="text-2xl font-bold">1,234</p>
										</div>
										<div className="text-green-600">
											<PiUsers className="w-6 h-6" />
										</div>
									</div>

									<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
										<div>
											<p className="font-medium text-sm">Active Today</p>
											<p className="text-2xl font-bold">89</p>
										</div>
										<div className="text-blue-600">
											<PiUsers className="w-6 h-6" />
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<PiGear className="w-5 h-5" />
									System Settings
								</CardTitle>
								<CardDescription>
									Configure system-wide settings
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm">Maintenance Mode</span>
										<Badge variant="outline">Disabled</Badge>
									</div>

									<div className="flex items-center justify-between">
										<span className="text-sm">Auto Backups</span>
										<Badge variant="default">Enabled</Badge>
									</div>

									<div className="flex items-center justify-between">
										<span className="text-sm">Email Notifications</span>
										<Badge variant="default">Enabled</Badge>
									</div>

									<div className="flex items-center justify-between">
										<span className="text-sm">Debug Mode</span>
										<Badge variant="destructive">Disabled</Badge>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<PiWarning className="w-5 h-5" />
									System Health
								</CardTitle>
								<CardDescription>Monitor system performance</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm">CPU Usage</span>
										<Badge variant="default">23%</Badge>
									</div>

									<div className="flex items-center justify-between">
										<span className="text-sm">Memory Usage</span>
										<Badge variant="secondary">67%</Badge>
									</div>

									<div className="flex items-center justify-between">
										<span className="text-sm">Disk Space</span>
										<Badge variant="destructive">89%</Badge>
									</div>

									<div className="flex items-center justify-between">
										<span className="text-sm">Database</span>
										<Badge variant="default">Healthy</Badge>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Admin Navigation Implementation */}
					<Card>
						<CardHeader>
							<CardTitle>Implementation Details</CardTitle>
							<CardDescription>
								How admin navigation is implemented in the layout system
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-3">
									<h4 className="font-medium">Permission Check:</h4>
									<div className="bg-muted/50 p-3 rounded-lg">
										<code className="text-sm">
											const isAdmin = !!useAuthData()?.user.isAdmin
										</code>
									</div>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Checks user.isAdmin property</li>
										<li>• Filters navigation items</li>
										<li>• Runtime permission validation</li>
									</ul>
								</div>

								<div className="space-y-3">
									<h4 className="font-medium">Navigation Structure:</h4>
									<div className="bg-muted/50 p-3 rounded-lg">
										<code className="text-sm">{`<NavAdmin />`}</code>
									</div>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Separate navigation component</li>
										<li>• Simple button design</li>
										<li>• Direct link to admin page</li>
									</ul>
								</div>
							</div>

							<div className="mt-4 p-3 bg-muted/50 rounded-lg">
								<p className="text-sm">
									<strong>Note:</strong> If you can see the admin section in the
									left sidebar, your user account has admin privileges. If not,
									you're viewing as a regular user.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Security Considerations */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<PiShield className="w-5 h-5" />
								Security Considerations
							</CardTitle>
							<CardDescription>
								Important security aspects of admin functionality
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-6 md:grid-cols-2">
								<div className="space-y-3">
									<h4 className="font-medium">Frontend Security:</h4>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• UI elements hidden from non-admins</li>
										<li>• Client-side permission checks</li>
										<li>• Conditional rendering</li>
										<li>• Route protection</li>
									</ul>
								</div>

								<div className="space-y-3">
									<h4 className="font-medium">Backend Security:</h4>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Server-side permission validation</li>
										<li>• API endpoint protection</li>
										<li>• Role-based access control</li>
										<li>• Audit logging</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="flex justify-between items-center pt-6 border-t">
						<Button variant="outline" asChild>
							<Link href="/layout-test/chat">
								<PiArrowLeft className="w-4 h-4 mr-2" />
								Previous: Chat Test
							</Link>
						</Button>
						<Button asChild>
							<Link href="/layout-test">Back to Test Home</Link>
						</Button>
					</div>
				</div>
			</StandardPage>
		</AppLayout>
	);
}
