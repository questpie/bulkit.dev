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
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@bulkit/ui/components/ui/tabs";
import Link from "next/link";
import {
	PiArrowLeft,
	PiFile,
	PiFileText,
	PiFolder,
	PiHandPointing,
	PiImage,
	PiListBullets,
	PiSquaresFour,
} from "react-icons/pi";

export default function FilesPageTest() {
	const mockFiles = [
		{
			id: 1,
			name: "Project Documentation.pdf",
			type: "document",
			size: "2.4 MB",
			modified: "2024-01-15",
			folder: "Documents",
		},
		{
			id: 2,
			name: "Hero Image.jpg",
			type: "image",
			size: "1.8 MB",
			modified: "2024-01-14",
			folder: "Images",
		},
		{
			id: 3,
			name: "Data Export.csv",
			type: "document",
			size: "456 KB",
			modified: "2024-01-13",
			folder: "Data",
		},
		{
			id: 4,
			name: "Logo Design.png",
			type: "image",
			size: "234 KB",
			modified: "2024-01-12",
			folder: "Assets",
		},
		{
			id: 5,
			name: "Meeting Notes.txt",
			type: "document",
			size: "12 KB",
			modified: "2024-01-11",
			folder: "Notes",
		},
		{
			id: 6,
			name: "Presentation.pptx",
			type: "document",
			size: "5.2 MB",
			modified: "2024-01-10",
			folder: "Presentations",
		},
	];

	const getFileIcon = (type: string) => {
		switch (type) {
			case "image":
				return <PiImage className="w-8 h-8 text-blue-500" />;
			case "document":
				return <PiFileText className="w-8 h-8 text-green-500" />;
			default:
				return <PiFile className="w-8 h-8 text-gray-500" />;
		}
	};

	return (
		<AppLayout>
			<StandardPage
				title="User-Action Driven Sidebar Test"
				description="This page demonstrates the new behavior where sidebar changes are triggered by user actions, not URL detection."
				breadcrumbs={[
					{ href: "/layout-test", label: "Layout Test" },
					{ label: "Files Test" },
				]}
				actions={
					<div className="flex gap-2">
						<Button variant="outline" size="sm">
							Upload Files
						</Button>
						<Button size="sm">New Folder</Button>
					</div>
				}
			>
				<div className="space-y-6">
					{/* How It Works Info */}
					<Alert>
						<PiHandPointing className="h-4 w-4" />
						<AlertTitle>User-Action Driven Behavior</AlertTitle>
						<AlertDescription>
							To see the dual-sidebar system in action,{" "}
							<strong>click the "Files" navigation item</strong> in the left
							sidebar. This will collapse the main sidebar to icons and show the
							files tree sidebar.
						</AlertDescription>
					</Alert>

					{/* Instruction Cards */}
					<div className="grid gap-4 md:grid-cols-3">
						<Card className="border-blue-200 bg-blue-50/50">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-blue-900">
									<PiFolder className="w-5 h-5" />
									Click "Files"
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-blue-800">
									Click the Files navigation item to trigger the dual-sidebar
									mode with files tree navigation.
								</p>
							</CardContent>
						</Card>

						<Card className="border-purple-200 bg-purple-50/50">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-purple-900">
									<PiHandPointing className="w-5 h-5" />
									Click "Admin"
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-purple-800">
									Click Administration to see admin navigation sidebar with
									different content.
								</p>
							</CardContent>
						</Card>

						<Card className="border-green-200 bg-green-50/50">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-green-900">
									<PiHandPointing className="w-5 h-5" />
									Click "Organization"
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-green-800">
									Click Organization to see organization management sidebar
									navigation.
								</p>
							</CardContent>
						</Card>
					</div>

					{/* New Behavior Explanation */}
					<Card className="border-orange-200 bg-orange-50/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Badge variant="secondary">New Behavior</Badge>
								User-Action Driven Sidebar
							</CardTitle>
							<CardDescription>
								The sidebar now responds to user actions instead of URL
								detection
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-3 md:grid-cols-2">
								<div className="space-y-2">
									<h4 className="font-medium text-orange-900">How It Works:</h4>
									<ul className="text-sm space-y-1">
										<li>• Left sidebar starts fully extended</li>
										<li>
											• Clicking Files/Admin/Organization triggers collapse
										</li>
										<li>• Nested sidebar content appears dynamically</li>
										<li>• Clicking main navigation resets to normal</li>
									</ul>
								</div>
								<div className="space-y-2">
									<h4 className="font-medium text-orange-900">Benefits:</h4>
									<ul className="text-sm space-y-1">
										<li>• User explicitly chooses to see more navigation</li>
										<li>• More intuitive and predictable behavior</li>
										<li>• Pages can control their own sidebar content</li>
										<li>• Better UX than automatic URL detection</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Mock Files Content */}
					<Card>
						<CardHeader>
							<CardTitle>File Management</CardTitle>
							<CardDescription>
								This demonstrates how the files page would look with the new
								sidebar system
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="grid" className="w-full">
								<TabsList className="grid w-full grid-cols-2 max-w-sm">
									<TabsTrigger value="grid" className="flex items-center gap-2">
										<PiSquaresFour className="w-4 h-4" />
										Grid View
									</TabsTrigger>
									<TabsTrigger value="list" className="flex items-center gap-2">
										<PiListBullets className="w-4 h-4" />
										List View
									</TabsTrigger>
								</TabsList>

								<TabsContent value="grid" className="mt-6">
									<div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
										{mockFiles.map((file) => (
											<Card
												key={file.id}
												className="cursor-pointer hover:shadow-md transition-shadow"
											>
												<CardContent className="p-4 text-center">
													<div className="flex justify-center mb-3">
														{getFileIcon(file.type)}
													</div>
													<h4 className="font-medium text-sm mb-1 truncate">
														{file.name}
													</h4>
													<p className="text-xs text-muted-foreground">
														{file.size}
													</p>
													<p className="text-xs text-muted-foreground">
														{file.modified}
													</p>
												</CardContent>
											</Card>
										))}
									</div>
								</TabsContent>

								<TabsContent value="list" className="mt-6">
									<div className="space-y-2">
										{mockFiles.map((file) => (
											<div
												key={file.id}
												className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
											>
												{getFileIcon(file.type)}
												<div className="flex-1">
													<h4 className="font-medium">{file.name}</h4>
													<p className="text-sm text-muted-foreground">
														{file.folder}
													</p>
												</div>
												<div className="text-right">
													<p className="text-sm">{file.size}</p>
													<p className="text-xs text-muted-foreground">
														{file.modified}
													</p>
												</div>
											</div>
										))}
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>

					{/* Implementation Details */}
					<Card>
						<CardHeader>
							<CardTitle>Implementation Details</CardTitle>
							<CardDescription>
								How the new user-action driven system works
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-3">
									<h4 className="font-medium">Context-Based State:</h4>
									<div className="bg-muted/50 p-3 rounded-lg">
										<code className="text-sm">
											{`const { setActiveNestedSidebar, setNestedSidebarContent } = useSidebar()`}
										</code>
									</div>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Global sidebar state management</li>
										<li>• Dynamic content injection</li>
										<li>• Cleanup on component unmount</li>
									</ul>
								</div>

								<div className="space-y-3">
									<h4 className="font-medium">Navigation Triggers:</h4>
									<div className="bg-muted/50 p-3 rounded-lg">
										<code className="text-sm">
											{`onClick={() => {
  setActiveNestedSidebar("files");
  setNestedSidebarContent(<FilesTree />);
}}`}
										</code>
									</div>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Click handlers on navigation items</li>
										<li>• Dynamic sidebar content</li>
										<li>• Reset on main nav clicks</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="flex justify-between items-center pt-6 border-t">
						<Button variant="outline" asChild>
							<Link href="/layout-test/list">
								<PiArrowLeft className="w-4 h-4 mr-2" />
								Previous: List Page
							</Link>
						</Button>
						<Button asChild>
							<Link href="/layout-test/chat">Next: Chat Test</Link>
						</Button>
					</div>
				</div>
			</StandardPage>
		</AppLayout>
	);
}
