import { AppLayout } from "@bulkit/app/app/(main)/_components/app-layout";
import { StandardPage } from "@bulkit/app/app/(main)/_components/page-templates";
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
	PiChat,
	PiRocketLaunch,
	PiSparkle,
	PiUsers,
} from "react-icons/pi";

export default function ChatPageTest() {
	return (
		<AppLayout>
			<StandardPage
				title="Chat Sidebar Test"
				description="This page demonstrates the right sidebar chat placeholder and its integration with the layout system."
				breadcrumbs={[
					{ href: "/layout-test", label: "Layout Test" },
					{ label: "Chat Test" },
				]}
				actions={
					<div className="flex gap-2">
						<Button variant="outline" size="sm">
							Settings
						</Button>
						<Button size="sm">Feedback</Button>
					</div>
				}
			>
				<div className="space-y-6">
					{/* Chat Sidebar Info */}
					<Card className="border-purple-200 bg-purple-50/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<PiChat className="w-5 h-5 text-purple-600" />
								Right Sidebar Chat System
								<Badge variant="secondary">Coming Soon</Badge>
							</CardTitle>
							<CardDescription>
								Look at the right side! The chat sidebar is always visible and
								ready for future integration.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-3 md:grid-cols-2">
								<div className="space-y-2">
									<h4 className="font-medium text-purple-900">
										Current Features:
									</h4>
									<ul className="text-sm space-y-1">
										<li>• Beautiful placeholder design</li>
										<li>• Gradient background</li>
										<li>• Professional CTA</li>
										<li>• Always visible on all pages</li>
									</ul>
								</div>
								<div className="space-y-2">
									<h4 className="font-medium text-purple-900">
										Future Features:
									</h4>
									<ul className="text-sm space-y-1">
										<li>• Real-time messaging</li>
										<li>• Team collaboration</li>
										<li>• File sharing</li>
										<li>• Voice/video calls</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Chat Features Preview */}
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<PiUsers className="w-5 h-5" />
									Team Collaboration
								</CardTitle>
								<CardDescription>
									Connect with your team members instantly
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
										<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
											JD
										</div>
										<div>
											<p className="font-medium text-sm">John Doe</p>
											<p className="text-xs text-muted-foreground">Online</p>
										</div>
									</div>

									<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
										<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
											JS
										</div>
										<div>
											<p className="font-medium text-sm">Jane Smith</p>
											<p className="text-xs text-muted-foreground">Away</p>
										</div>
									</div>

									<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
										<div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
											MB
										</div>
										<div>
											<p className="font-medium text-sm">Mike Brown</p>
											<p className="text-xs text-muted-foreground">Offline</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<PiSparkle className="w-5 h-5" />
									AI Integration
								</CardTitle>
								<CardDescription>
									Smart assistance and automation
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
										<p className="text-sm font-medium mb-1">AI Assistant</p>
										<p className="text-xs text-muted-foreground">
											Get help with tasks, generate content, and automate
											workflows
										</p>
									</div>

									<div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
										<p className="text-sm font-medium mb-1">
											Smart Suggestions
										</p>
										<p className="text-xs text-muted-foreground">
											Intelligent recommendations based on your activity
										</p>
									</div>

									<div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
										<p className="text-sm font-medium mb-1">
											Content Generation
										</p>
										<p className="text-xs text-muted-foreground">
											Create posts, documents, and more with AI assistance
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Integration Benefits */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<PiRocketLaunch className="w-5 h-5" />
								Integration Benefits
							</CardTitle>
							<CardDescription>
								How the chat system enhances the overall experience
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-6 md:grid-cols-3">
								<div className="text-center space-y-2">
									<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
										<PiChat className="w-6 h-6 text-blue-600" />
									</div>
									<h4 className="font-medium">Contextual Communication</h4>
									<p className="text-sm text-muted-foreground">
										Chat about specific files, tasks, or projects without losing
										context
									</p>
								</div>

								<div className="text-center space-y-2">
									<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
										<PiUsers className="w-6 h-6 text-green-600" />
									</div>
									<h4 className="font-medium">Seamless Collaboration</h4>
									<p className="text-sm text-muted-foreground">
										Work together on projects while staying in the same
										interface
									</p>
								</div>

								<div className="text-center space-y-2">
									<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
										<PiSparkle className="w-6 h-6 text-purple-600" />
									</div>
									<h4 className="font-medium">AI-Powered Assistance</h4>
									<p className="text-sm text-muted-foreground">
										Get intelligent help and suggestions right where you work
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Layout Consistency */}
					<Card>
						<CardHeader>
							<CardTitle>Layout Consistency</CardTitle>
							<CardDescription>
								How the chat sidebar maintains consistency across all pages
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-3">
									<h4 className="font-medium">Always Available:</h4>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Visible on all pages</li>
										<li>• Consistent width and position</li>
										<li>• Maintains state across navigation</li>
										<li>• Responsive design</li>
									</ul>
								</div>
								<div className="space-y-3">
									<h4 className="font-medium">Smart Integration:</h4>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Adapts to dual-sidebar mode</li>
										<li>• Works with mobile layouts</li>
										<li>• Collapsible when needed</li>
										<li>• Keyboard shortcut support</li>
									</ul>
								</div>
							</div>

							<div className="mt-4 p-3 bg-muted/50 rounded-lg">
								<p className="text-sm">
									<strong>Try this:</strong> Navigate between different test
									pages to see how the chat sidebar remains consistently
									positioned and accessible.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="flex justify-between items-center pt-6 border-t">
						<Button variant="outline" asChild>
							<Link href="/layout-test/files">
								<PiArrowLeft className="w-4 h-4 mr-2" />
								Previous: Files Test
							</Link>
						</Button>
						<Button asChild>
							<Link href="/layout-test/admin">Next: Admin Test</Link>
						</Button>
					</div>
				</div>
			</StandardPage>
		</AppLayout>
	);
}
