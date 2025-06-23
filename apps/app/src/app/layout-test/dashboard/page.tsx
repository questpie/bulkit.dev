import { AppLayout } from "@bulkit/app/app/(main)/_components/app-layout";
import { DashboardPage } from "@bulkit/app/app/(main)/_components/page-templates";
import { Button } from "@bulkit/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@bulkit/ui/components/ui/card";
import { Progress } from "@bulkit/ui/components/ui/progress";
import Link from "next/link";
import {
	PiArrowLeft,
	PiArrowsClockwise,
	PiPlus,
	PiTrendUp,
} from "react-icons/pi";

export default function DashboardPageTest() {
	const mockStats = [
		{
			label: "Total Revenue",
			value: "$45,231.89",
			change: "+20.1%",
			trend: "up" as const,
		},
		{
			label: "Active Users",
			value: "2,350",
			change: "+180.1%",
			trend: "up" as const,
		},
		{
			label: "Conversion Rate",
			value: "12.5%",
			change: "-4.3%",
			trend: "down" as const,
		},
		{
			label: "Total Posts",
			value: "573",
			change: "+12.5%",
			trend: "up" as const,
		},
	];

	return (
		<AppLayout>
			<DashboardPage
				title="Dashboard Template"
				description="This demonstrates the DashboardPage template with stats cards and metrics overview."
				stats={mockStats}
				actions={
					<div className="flex gap-2">
						<Button variant="outline" size="sm">
							<PiArrowsClockwise className="w-4 h-4 mr-2" />
							Refresh
						</Button>
						<Button size="sm">
							<PiPlus className="w-4 h-4 mr-2" />
							Add Widget
						</Button>
					</div>
				}
			>
				{/* Dashboard Content */}
				<div className="space-y-6">
					{/* Charts Section */}
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Revenue Overview</CardTitle>
								<CardDescription>Monthly revenue trends</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">January</span>
										<span className="text-sm text-muted-foreground">
											$12,345
										</span>
									</div>
									<Progress value={75} />

									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">February</span>
										<span className="text-sm text-muted-foreground">
											$15,678
										</span>
									</div>
									<Progress value={85} />

									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">March</span>
										<span className="text-sm text-muted-foreground">
											$18,901
										</span>
									</div>
									<Progress value={95} />
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>User Activity</CardTitle>
								<CardDescription>Weekly active users</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">This Week</span>
										<div className="flex items-center gap-1 text-sm text-green-600">
											<PiTrendUp className="w-3 h-3" />
											+12.5%
										</div>
									</div>
									<div className="text-2xl font-bold">2,350</div>

									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Last Week</span>
										<span className="text-sm text-muted-foreground">2,089</span>
									</div>
									<Progress value={68} />
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Recent Activity */}
					<Card>
						<CardHeader>
							<CardTitle>Recent Activity</CardTitle>
							<CardDescription>Latest updates and activities</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									<div className="flex-1">
										<p className="text-sm font-medium">New user registration</p>
										<p className="text-xs text-muted-foreground">
											john@example.com joined 2 minutes ago
										</p>
									</div>
								</div>

								<div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									<div className="flex-1">
										<p className="text-sm font-medium">Post published</p>
										<p className="text-xs text-muted-foreground">
											"Getting Started with React" was published 5 minutes ago
										</p>
									</div>
								</div>

								<div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
									<div className="w-2 h-2 bg-orange-500 rounded-full"></div>
									<div className="flex-1">
										<p className="text-sm font-medium">System update</p>
										<p className="text-xs text-muted-foreground">
											Database backup completed 10 minutes ago
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Template Features */}
					<Card>
						<CardHeader>
							<CardTitle>Dashboard Template Features</CardTitle>
							<CardDescription>
								What makes this template special
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<h4 className="font-medium">Stats Cards</h4>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Automatic stats grid layout</li>
										<li>• Trend indicators (up/down/neutral)</li>
										<li>• Responsive design</li>
										<li>• Customizable metrics</li>
									</ul>
								</div>

								<div className="space-y-2">
									<h4 className="font-medium">Content Areas</h4>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Flexible widget system</li>
										<li>• Chart integration ready</li>
										<li>• Activity feeds</li>
										<li>• Real-time updates</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="flex justify-between items-center pt-6 border-t">
						<Button variant="outline" asChild>
							<Link href="/layout-test/standard">
								<PiArrowLeft className="w-4 h-4 mr-2" />
								Previous: Standard Page
							</Link>
						</Button>
						<Button asChild>
							<Link href="/layout-test/list">Next: List Template</Link>
						</Button>
					</div>
				</div>
			</DashboardPage>
		</AppLayout>
	);
}
