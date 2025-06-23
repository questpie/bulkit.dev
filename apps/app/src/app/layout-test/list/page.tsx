import { AppLayout } from "@bulkit/app/app/(main)/_components/app-layout";
import { ListPage } from "@bulkit/app/app/(main)/_components/page-templates";
import { Badge } from "@bulkit/ui/components/ui/badge";
import { Button } from "@bulkit/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@bulkit/ui/components/ui/card";
import { Input } from "@bulkit/ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@bulkit/ui/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@bulkit/ui/components/ui/table";
import Link from "next/link";
import {
	PiArrowLeft,
	PiDownload,
	PiFunnel,
	PiMagnifyingGlass,
	PiPlus,
} from "react-icons/pi";

export default function ListPageTest() {
	const mockData = [
		{
			id: 1,
			name: "React Dashboard",
			status: "Published",
			category: "Web Development",
			author: "John Doe",
			date: "2024-01-15",
			views: 1234,
		},
		{
			id: 2,
			name: "Vue.js Components",
			status: "Draft",
			category: "Frontend",
			author: "Jane Smith",
			date: "2024-01-14",
			views: 856,
		},
		{
			id: 3,
			name: "Node.js API Guide",
			status: "Published",
			category: "Backend",
			author: "Mike Johnson",
			date: "2024-01-13",
			views: 2341,
		},
		{
			id: 4,
			name: "Database Design",
			status: "Review",
			category: "Database",
			author: "Sarah Wilson",
			date: "2024-01-12",
			views: 567,
		},
		{
			id: 5,
			name: "Mobile App UI",
			status: "Published",
			category: "Mobile",
			author: "Tom Brown",
			date: "2024-01-11",
			views: 1789,
		},
	];

	const getStatusBadge = (status: string) => {
		const variants = {
			Published: "default",
			Draft: "secondary",
			Review: "outline",
		} as const;

		return (
			<Badge variant={variants[status as keyof typeof variants] || "secondary"}>
				{status}
			</Badge>
		);
	};

	return (
		<AppLayout>
			<ListPage
				title="List Page Template"
				description="This demonstrates the ListPage template with filters, search, and table data."
				breadcrumbs={[
					{ href: "/layout-test", label: "Layout Test" },
					{ label: "List Page" },
				]}
				actions={
					<div className="flex gap-2">
						<Button variant="outline" size="sm">
							<PiDownload className="w-4 h-4 mr-2" />
							Export
						</Button>
						<Button size="sm">
							<PiPlus className="w-4 h-4 mr-2" />
							Add Item
						</Button>
					</div>
				}
				filters={
					<div className="flex flex-wrap gap-4">
						<div className="flex items-center gap-2">
							<PiMagnifyingGlass className="w-4 h-4 text-muted-foreground" />
							<Input
								placeholder="Search items..."
								className={{ wrapper: "w-64" }}
							/>
						</div>
						<Select defaultValue="all">
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="published">Published</SelectItem>
								<SelectItem value="draft">Draft</SelectItem>
								<SelectItem value="review">Review</SelectItem>
							</SelectContent>
						</Select>
						<Select defaultValue="all">
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								<SelectItem value="web">Web Development</SelectItem>
								<SelectItem value="frontend">Frontend</SelectItem>
								<SelectItem value="backend">Backend</SelectItem>
								<SelectItem value="mobile">Mobile</SelectItem>
							</SelectContent>
						</Select>
						<Button variant="outline" size="sm">
							<PiFunnel className="w-4 h-4 mr-2" />
							More Filters
						</Button>
					</div>
				}
			>
				{/* List Content */}
				<div className="space-y-6">
					{/* Data Table */}
					<Card>
						<CardHeader>
							<CardTitle>Items List</CardTitle>
							<CardDescription>
								A sample data table showing how content is displayed in the list
								template
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Author</TableHead>
										<TableHead>Date</TableHead>
										<TableHead className="text-right">Views</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{mockData.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-medium">{item.name}</TableCell>
											<TableCell>{getStatusBadge(item.status)}</TableCell>
											<TableCell>{item.category}</TableCell>
											<TableCell>{item.author}</TableCell>
											<TableCell>
												{new Date(item.date).toLocaleDateString()}
											</TableCell>
											<TableCell className="text-right">
												{item.views.toLocaleString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Pagination */}
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							Showing 1 to 5 of 5 results
						</p>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" disabled>
								Previous
							</Button>
							<Button variant="outline" size="sm" disabled>
								Next
							</Button>
						</div>
					</div>

					{/* Template Features */}
					<Card>
						<CardHeader>
							<CardTitle>List Template Features</CardTitle>
							<CardDescription>What this template provides</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<h4 className="font-medium">Filter System</h4>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Search input integration</li>
										<li>• Multiple filter dropdowns</li>
										<li>• Advanced filter options</li>
										<li>• Filter state management</li>
									</ul>
								</div>

								<div className="space-y-2">
									<h4 className="font-medium">Data Display</h4>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Responsive table layout</li>
										<li>• Sorting capabilities</li>
										<li>• Pagination controls</li>
										<li>• Bulk actions support</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="flex justify-between items-center pt-6 border-t">
						<Button variant="outline" asChild>
							<Link href="/layout-test/dashboard">
								<PiArrowLeft className="w-4 h-4 mr-2" />
								Previous: Dashboard
							</Link>
						</Button>
						<Button asChild>
							<Link href="/layout-test/files">Next: Files Test</Link>
						</Button>
					</div>
				</div>
			</ListPage>
		</AppLayout>
	);
}
