import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@bulkit/ui/components/ui/breadcrumb";
import { Button } from "@bulkit/ui/components/ui/button";
import { cn } from "@bulkit/ui/lib";
import type { PropsWithChildren, ReactNode } from "react";

// Standard Page Template
type StandardPageProps = PropsWithChildren<{
	title: string;
	description?: string;
	breadcrumbs?: Array<{ href?: string; label: string }>;
	actions?: ReactNode;
	className?: string;
}>;

export function StandardPage({
	children,
	title,
	description,
	breadcrumbs,
	actions,
	className,
}: StandardPageProps) {
	return (
		<div className="flex flex-col min-h-full">
			{/* Page Header */}
			<div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container max-w-screen-2xl py-6">
					{/* Breadcrumbs */}
					{breadcrumbs && breadcrumbs.length > 0 && (
						<Breadcrumb className="mb-4">
							<BreadcrumbList>
								{breadcrumbs.map((crumb, index) => (
									<div key={index} className="flex items-center">
										<BreadcrumbItem>
											{crumb.href && index < breadcrumbs.length - 1 ? (
												<BreadcrumbLink href={crumb.href}>
													{crumb.label}
												</BreadcrumbLink>
											) : (
												<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
											)}
										</BreadcrumbItem>
										{index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
									</div>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					)}

					{/* Title & Actions */}
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
							{description && (
								<p className="text-muted-foreground mt-2">{description}</p>
							)}
						</div>
						{actions && (
							<div className="flex items-center gap-2">{actions}</div>
						)}
					</div>
				</div>
			</div>

			{/* Page Content */}
			<div className={cn("flex-1 container max-w-screen-2xl py-6", className)}>
				{children}
			</div>
		</div>
	);
}

// Dashboard/Grid Template
type DashboardPageProps = PropsWithChildren<{
	title: string;
	description?: string;
	stats?: Array<{
		label: string;
		value: string | number;
		change?: string;
		trend?: "up" | "down" | "neutral";
	}>;
	actions?: ReactNode;
	className?: string;
}>;

export function DashboardPage({
	children,
	title,
	description,
	stats,
	actions,
	className,
}: DashboardPageProps) {
	return (
		<div className="flex flex-col min-h-full w-full px-4 max-w-[1440px] mx-auto">
			{/* Dashboard Header */}
			<div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container max-w-screen-2xl py-6">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
							{description && (
								<p className="text-muted-foreground mt-2">{description}</p>
							)}
						</div>
						{actions && (
							<div className="flex items-center gap-2">{actions}</div>
						)}
					</div>

					{/* Stats Cards */}
					{stats && stats.length > 0 && (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							{stats.map((stat, index) => (
								<div
									key={index}
									className="rounded-lg border bg-card text-card-foreground shadow-sm p-6"
								>
									<div className="flex flex-row items-center justify-between space-y-0 pb-2">
										<p className="text-sm font-medium">{stat.label}</p>
									</div>
									<div>
										<div className="text-2xl font-bold">{stat.value}</div>
										{stat.change && (
											<p className="text-xs text-muted-foreground">
												<span
													className={cn(
														stat.trend === "up" && "text-green-600",
														stat.trend === "down" && "text-red-600",
													)}
												>
													{stat.change}
												</span>{" "}
												from last month
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Dashboard Content */}
			<div className={cn("flex-1 container max-w-screen-2xl py-6", className)}>
				{children}
			</div>
		</div>
	);
}

// List/Table Template
type ListPageProps = PropsWithChildren<{
	title: string;
	description?: string;
	breadcrumbs?: Array<{ href?: string; label: string }>;
	actions?: ReactNode;
	filters?: ReactNode;
	className?: string;
}>;

export function ListPage({
	children,
	title,
	description,
	breadcrumbs,
	actions,
	filters,
	className,
}: ListPageProps) {
	return (
		<div className="flex flex-col min-h-full px-4">
			{/* List Header */}
			<div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container max-w-screen-2xl py-6">
					{/* Breadcrumbs */}
					{breadcrumbs && breadcrumbs.length > 0 && (
						<Breadcrumb className="mb-4">
							<BreadcrumbList>
								{breadcrumbs.map((crumb, index) => (
									<div key={index} className="flex items-center">
										<BreadcrumbItem>
											{crumb.href && index < breadcrumbs.length - 1 ? (
												<BreadcrumbLink href={crumb.href}>
													{crumb.label}
												</BreadcrumbLink>
											) : (
												<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
											)}
										</BreadcrumbItem>
										{index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
									</div>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					)}

					{/* Title & Actions */}
					<div className="flex items-center justify-between mb-4">
						<div>
							<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
							{description && (
								<p className="text-muted-foreground mt-2">{description}</p>
							)}
						</div>
						{actions && (
							<div className="flex items-center gap-2">{actions}</div>
						)}
					</div>

					{/* Filters */}
					{filters && <div className="flex items-center gap-4">{filters}</div>}
				</div>
			</div>

			{/* List Content */}
			<div className={cn("flex-1 container max-w-screen-2xl py-6", className)}>
				{children}
			</div>
		</div>
	);
}
