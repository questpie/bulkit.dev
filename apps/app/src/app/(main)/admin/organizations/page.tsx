import { apiServer } from "@bulkit/app/api/api.server";
import { getPagination } from "@bulkit/app/app/_utils/pagination";
import { PageDescription } from "@bulkit/app/app/(main)/admin/_components/page-description";
import { OrganizationsTable } from "@bulkit/app/app/(main)/organizations/_components/organizations-table";

export default async function AdminOrganizationsPage(props: {
	searchParams: Promise<Record<string, any>>;
}) {
	const pagination = getPagination(await props.searchParams, 25);
	const organizations = await apiServer.organizations.get({
		query: {
			limit: pagination.limit,
			cursor: pagination.cursor,
		},
	});

	return (
		<div className="p-6">
			<PageDescription
				title="Organizations"
				description="Manage organizations, their members, and settings. Control access levels and configure organization-wide preferences."
			/>
			{!!organizations.data?.data.length && (
				<div className="mt-6">
					<OrganizationsTable initialOrganizations={organizations.data} />
				</div>
			)}
			{!organizations.data?.data.length && (
				<div className="text-center py-12">
					<h2 className="text-2xl font-semibold mb-2">
						No organizations found
					</h2>
					<p className="text-muted-foreground">
						No organizations are available for management.
					</p>
				</div>
			)}
		</div>
	);
}
