import { apiClient } from "@bulkit/app/api/api.client";
import type {
	AddLabelsToResourceInput,
	BulkLabelOperation,
	CreateLabelCategoryInput,
	CreateLabelInput,
	Label,
	LabelCategory,
	LabelFilters,
	LabelWithStats,
	RemoveLabelsFromResourceInput,
	UpdateLabelInput,
} from "@bulkit/shared/modules/labels/labels.schemas";
import { toast } from "@bulkit/ui/components/ui/sonner";
import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

export const LABELS_QUERY_KEY = "labels";

// Label queries
export function labelsQueryOptions(filters?: LabelFilters) {
	return queryOptions({
		queryKey: [LABELS_QUERY_KEY, "list", filters],
		queryFn: async () => {
			const res = await apiClient.labels.get({
				query: filters || {},
			});
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

export function labelQueryOptions(labelId: string) {
	return queryOptions({
		queryKey: [LABELS_QUERY_KEY, labelId],
		queryFn: async () => {
			const res = await apiClient.labels({ id: labelId }).get();
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

export function labelCategoriesQueryOptions() {
	return queryOptions({
		queryKey: [LABELS_QUERY_KEY, "categories"],
		queryFn: async () => {
			const res = await apiClient.labels.categories.get();
			if (res.error) throw res.error;
			return res.data.data;
		},
	});
}

export function resourceLabelsQueryOptions(opts: {
	resourceId?: string;
	resourceType?: string;
	resourceIds?: string[];
}) {
	return queryOptions({
		queryKey: [LABELS_QUERY_KEY, "resources", opts],
		queryFn: async () => {
			const res = await apiClient.labels.resources.get({
				query: opts,
			});
			if (res.error) throw res.error;
			return res.data.data;
		},
	});
}

// Label mutations
export function useCreateLabelMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateLabelInput) => {
			const res = await apiClient.labels.post(input);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: [LABELS_QUERY_KEY] });
			toast.success(`Label "${data.name}" created successfully`);
		},
		onError: (error) => {
			toast.error(`Failed to create label: ${error.message}`);
		},
	});
}

export function useUpdateLabelMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...input }: UpdateLabelInput & { id: string }) => {
			const res = await apiClient.labels({ id }).put(input);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: [LABELS_QUERY_KEY] });
			toast.success(`Label "${data.name}" updated successfully`);
		},
		onError: (error) => {
			toast.error(`Failed to update label: ${error.message}`);
		},
	});
}

export function useDeleteLabelMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (labelId: string) => {
			const res = await apiClient.labels({ id: labelId }).delete();
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [LABELS_QUERY_KEY] });
			toast.success("Label deleted successfully");
		},
		onError: (error: any) => {
			if (error.status === 400) {
				toast.error(
					error.value?.error || "Cannot delete label - it is currently in use",
				);
			} else {
				toast.error(`Failed to delete label: ${error.message}`);
			}
		},
	});
}

// Resource label mutations
export function useAddLabelsToResourceMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: AddLabelsToResourceInput) => {
			const res = await apiClient.labels.resources.add.post(input);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [LABELS_QUERY_KEY, "resources"],
			});
			// Also invalidate the specific resource queries
			if (variables.resourceType === "task") {
				queryClient.invalidateQueries({ queryKey: ["tasks"] });
			}
			toast.success("Labels added successfully");
		},
		onError: (error) => {
			toast.error(`Failed to add labels: ${error.message}`);
		},
	});
}

export function useRemoveLabelsFromResourceMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: RemoveLabelsFromResourceInput) => {
			const res = await apiClient.labels.resources.remove.post(input);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [LABELS_QUERY_KEY, "resources"],
			});
			// Also invalidate the specific resource queries
			if (variables.resourceType === "task") {
				queryClient.invalidateQueries({ queryKey: ["tasks"] });
			}
			toast.success("Labels removed successfully");
		},
		onError: (error) => {
			toast.error(`Failed to remove labels: ${error.message}`);
		},
	});
}

export function useBulkLabelOperationMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: BulkLabelOperation) => {
			const res = await apiClient.labels.bulk.post(input);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [LABELS_QUERY_KEY, "resources"],
			});
			// Also invalidate the specific resource queries
			if (variables.resourceType === "task") {
				queryClient.invalidateQueries({ queryKey: ["tasks"] });
			}

			const operationText = {
				add: "added to",
				remove: "removed from",
				replace: "updated on",
			}[variables.operation];

			toast.success(
				`Labels ${operationText} ${variables.resourceIds.length} resource(s)`,
			);
		},
		onError: (error) => {
			toast.error(`Failed to update labels: ${error.message}`);
		},
	});
}

// Label category mutations
export function useCreateLabelCategoryMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateLabelCategoryInput) => {
			const res = await apiClient.labels.categories.post(input);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: [LABELS_QUERY_KEY] });
			toast.success(`Category "${data.name}" created successfully`);
		},
		onError: (error) => {
			toast.error(`Failed to create category: ${error.message}`);
		},
	});
}
