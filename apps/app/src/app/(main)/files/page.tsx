import { apiServer } from "@bulkit/app/api/api.server";
import { FilesPageClient } from "./files-page-client";

export default async function FilesPage() {
	// Fetch initial root folder contents on the server
	const initialContents = await apiServer.folders.get({
		query: { includeSubfolders: true, includeItems: true },
	});

	return (
		<FilesPageClient
			initialContents={initialContents.data || null}
			currentFolderId={null}
		/>
	);
}
