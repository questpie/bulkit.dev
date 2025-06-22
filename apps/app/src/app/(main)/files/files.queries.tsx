import { apiClient } from "@bulkit/app/api/api.client";
import type {
	AddItemToFolder,
	BreadcrumbItem,
	CreateFolder,
	Folder,
	FolderContentsResponse,
	FolderItem,
	FolderPermissionsResponse,
	GrantFolderPermission,
	MoveFolderItem,
	RevokeFolderPermission,
	SearchFolders,
	UpdateFolder,
	UpdateFolderItemOrder,
	UpdateFolderPermission,
} from "@bulkit/shared/modules/folders/folders.schemas";
import { toast } from "@bulkit/ui/components/ui/sonner";
import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

export const FOLDERS_QUERY_KEY = "folders";

// Folder contents query (for root or specific folder)
export function folderContentsQueryOptions(folderId?: string | null) {
	return queryOptions({
		queryKey: [FOLDERS_QUERY_KEY, "contents", folderId],
		queryFn: async () => {
			if (!folderId) {
				// Root folder
				const res = await apiClient.folders.get({
					query: { includeSubfolders: true, includeItems: true },
				});
				if (res.error) throw res.error;
				return res.data;
			}

			// Specific folder
			const res = await apiClient.folders({ id: folderId }).contents.get({
				query: { includeSubfolders: true, includeItems: true },
			});
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

// Single folder query
export function folderQueryOptions(folderId: string) {
	return queryOptions({
		queryKey: [FOLDERS_QUERY_KEY, folderId],
		queryFn: async () => {
			const res = await apiClient.folders({ id: folderId }).get();
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

// Folder breadcrumbs query
export function folderBreadcrumbsQueryOptions(folderId: string) {
	return queryOptions({
		queryKey: [FOLDERS_QUERY_KEY, "breadcrumbs", folderId],
		queryFn: async () => {
			const res = await apiClient.folders({ id: folderId }).breadcrumbs.get();
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

// Search folders query
export function searchFoldersQueryOptions(searchParams: SearchFolders) {
	return queryOptions({
		queryKey: [FOLDERS_QUERY_KEY, "search", searchParams],
		queryFn: async () => {
			const res = await apiClient.folders.search.get({
				query: searchParams,
			});
			if (res.error) throw res.error;
			return res.data;
		},
		enabled: !!searchParams.query,
	});
}

// Folder permissions query
export function folderPermissionsQueryOptions(folderId: string) {
	return queryOptions({
		queryKey: [FOLDERS_QUERY_KEY, "permissions", folderId],
		queryFn: async () => {
			const res = await apiClient.folders({ id: folderId }).permissions.get();
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

// User's permission for a folder
export function userFolderPermissionQueryOptions(folderId: string) {
	return queryOptions({
		queryKey: [FOLDERS_QUERY_KEY, "user-permission", folderId],
		queryFn: async () => {
			const res = await apiClient
				.folders({ id: folderId })
				.permissions.me.get();
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

// Mutations
export function useCreateFolder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateFolder) => {
			const res = await apiClient.folders.post(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (_, variables) => {
			// Invalidate folder contents queries
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, "contents", variables.parentFolderId],
			});
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, "contents", null],
			});
			toast.success("Folder created successfully");
		},
		onError: (error: any) => {
			toast.error(`Failed to create folder: ${error.message}`);
		},
	});
}

export function useUpdateFolder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { folderId: string; data: UpdateFolder }) => {
			const res = await apiClient
				.folders({ id: params.folderId })
				.put(params.data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (data, variables) => {
			// Invalidate specific folder and its parent folder contents
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, variables.folderId],
			});
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, "contents"],
			});
			toast.success("Folder updated successfully");
		},
		onError: (error: any) => {
			toast.error(`Failed to update folder: ${error.message}`);
		},
	});
}

export function useDeleteFolder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (folderId: string) => {
			const res = await apiClient.folders({ id: folderId }).delete();
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			// Invalidate all folder-related queries
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY],
			});
			toast.success("Folder deleted successfully");
		},
		onError: (error: any) => {
			toast.error(`Failed to delete folder: ${error.message}`);
		},
	});
}

export function useAddItemToFolder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: AddItemToFolder) => {
			const res = await apiClient.folders.items.post(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (_, variables) => {
			// Invalidate folder contents
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, "contents", variables.folderId],
			});
			toast.success("Item added to folder successfully");
		},
		onError: (error: any) => {
			toast.error(`Failed to add item to folder: ${error.message}`);
		},
	});
}

export function useMoveItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: MoveFolderItem) => {
			const res = await apiClient.folders.items.move.put(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			// Invalidate all folder contents queries
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, "contents"],
			});
			toast.success("Item moved successfully");
		},
		onError: (error: any) => {
			toast.error(`Failed to move item: ${error.message}`);
		},
	});
}

export function useUpdateItemOrder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: {
			folderId: string;
			data: UpdateFolderItemOrder;
		}) => {
			const res = await apiClient
				.folders({ id: params.folderId })
				.items.order.put(params.data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (_, variables) => {
			// Invalidate folder contents
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, "contents", variables.folderId],
			});
		},
		onError: (error: any) => {
			toast.error(`Failed to update item order: ${error.message}`);
		},
	});
}

// Permission mutations
export function useGrantFolderPermission() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: GrantFolderPermission) => {
			const res = await apiClient.folders.permissions.post(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, "permissions", variables.folderId],
			});
			toast.success("Permission granted successfully");
		},
		onError: (error: any) => {
			toast.error(`Failed to grant permission: ${error.message}`);
		},
	});
}

export function useUpdateFolderPermission() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: {
			folderId: string;
			userId: string;
			data: UpdateFolderPermission;
		}) => {
			const res = await apiClient
				.folders({ folderId: params.folderId })
				.permissions({ userId: params.userId })
				.put(params.data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, "permissions", variables.folderId],
			});
			toast.success("Permission updated successfully");
		},
		onError: (error: any) => {
			toast.error(`Failed to update permission: ${error.message}`);
		},
	});
}

export function useRevokeFolderPermission() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: RevokeFolderPermission) => {
			const res = await apiClient.folders.permissions.delete(data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [FOLDERS_QUERY_KEY, "permissions", variables.folderId],
			});
			toast.success("Permission revoked successfully");
		},
		onError: (error: any) => {
			toast.error(`Failed to revoke permission: ${error.message}`);
		},
	});
}
