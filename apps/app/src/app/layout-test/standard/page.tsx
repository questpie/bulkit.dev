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
import { PiArrowLeft, PiDownload, PiPlus } from "react-icons/pi";

export default function StandardPageTest() {
	return (
		<AppLayout>
			<StandardPage
				title="Standard Page Template"
				description="This demonstrates the StandardPage template with title, description, breadcrumbs, and action buttons."
				breadcrumbs={[
					{ href: "/layout-test", label: "Layout Test" },
					{ label: "Standard Page" },
				]}
				actions={
					<div className="flex gap-2">
						<Button variant="outline" size="sm">
							<PiDownload className="w-4 h-4 mr-2" />
							Export
						</Button>
						<Button size="sm">
							<PiPlus className="w-4 h-4 mr-2" />
							Create New
						</Button>
					</div>
				}
			>
				{/* Page Content */}
				<div className="space-y-6">
					{/* Feature Cards */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									Header Section
									<Badge variant="secondary">Feature</Badge>
								</CardTitle>
								<CardDescription>
									Consistent header with title, description, and breadcrumbs
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="text-sm space-y-1">
									<li>• Page title and description</li>
									<li>• Breadcrumb navigation</li>
									<li>• Action buttons</li>
									<li>• Responsive layout</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									Content Area
									<Badge variant="secondary">Layout</Badge>
								</CardTitle>
								<CardDescription>
									Flexible content area with proper spacing
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="text-sm space-y-1">
									<li>• Container max-width</li>
									<li>• Consistent padding</li>
									<li>• Responsive grid system</li>
									<li>• Proper typography</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									Accessibility
									<Badge variant="secondary">A11y</Badge>
								</CardTitle>
								<CardDescription>
									Built with accessibility in mind
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="text-sm space-y-1">
									<li>• Semantic HTML structure</li>
									<li>• Proper heading hierarchy</li>
									<li>• Focus management</li>
									<li>• Screen reader friendly</li>
								</ul>
							</CardContent>
						</Card>
					</div>

					{/* Sample Content */}
					<Card>
						<CardHeader>
							<CardTitle>Sample Content Section</CardTitle>
							<CardDescription>
								This is how regular content would look within the standard page
								template
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-muted-foreground">
								The StandardPage template provides a consistent structure for
								all basic pages in the application. It includes a header section
								with title, description, breadcrumbs, and action buttons,
								followed by a flexible content area that can accommodate any
								type of content.
							</p>

							<div className="bg-muted/50 p-4 rounded-lg">
								<h4 className="font-medium mb-2">Template Props:</h4>
								<ul className="text-sm space-y-1">
									<li>
										<code className="bg-background px-1 rounded">title</code> -
										Page title
									</li>
									<li>
										<code className="bg-background px-1 rounded">
											description
										</code>{" "}
										- Page description (optional)
									</li>
									<li>
										<code className="bg-background px-1 rounded">
											breadcrumbs
										</code>{" "}
										- Navigation breadcrumbs (optional)
									</li>
									<li>
										<code className="bg-background px-1 rounded">actions</code>{" "}
										- Action buttons (optional)
									</li>
									<li>
										<code className="bg-background px-1 rounded">children</code>{" "}
										- Page content
									</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="flex justify-between items-center pt-6 border-t">
						<Button variant="outline" asChild>
							<Link href="/layout-test">
								<PiArrowLeft className="w-4 h-4 mr-2" />
								Back to Test Home
							</Link>
						</Button>
						<Button asChild>
							<Link href="/layout-test/dashboard">
								Next: Dashboard Template
							</Link>
						</Button>
					</div>
				</div>
			</StandardPage>
		</AppLayout>
	);
}
