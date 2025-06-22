import { apiClient } from "@bulkit/app/api/api.client";
import type { TaskStatus } from "@bulkit/shared/constants/db.constants";
import type {
	CreateDependencyInput,
	CreateTaskInput,
	ReorderTasksInput,
	TaskFilters,
	TaskListItem,
	TaskStats,
	TaskWithRelations,
	UpdateTaskInput,
} from "@bulkit/shared/modules/tasks/tasks.schemas";
import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

export const TASKS_QUERY_KEY = "tasks";

// Single task query
export function taskQueryOptions(taskId: string) {
	return queryOptions({
		queryKey: [TASKS_QUERY_KEY, taskId],
		queryFn: async () => {
			const res = await apiClient.tasks({ id: taskId }).get();
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

// Tasks list query with filters
export function tasksQueryOptions(filters: TaskFilters = {}) {
	return queryOptions({
		queryKey: [TASKS_QUERY_KEY, "list", filters],
		queryFn: async () => {
			const res = await apiClient.tasks.get({
				query: filters,
			});
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

// Kanban board query (tasks grouped by status)
export function kanbanQueryOptions() {
	return queryOptions({
		queryKey: [TASKS_QUERY_KEY, "kanban"],
		queryFn: async () => {
			const res = await apiClient.tasks.get({
				query: {
					// parentTaskId: null, // Only root tasks for kanban
					limit: 100,
					sortField: "orderIndex",
					sortDirection: "asc",
				},
			});
			if (res.error) throw res.error;

			// Group tasks by status
			const tasksByStatus = {
				todo: [] as TaskListItem[],
				in_progress: [] as TaskListItem[],
				review: [] as TaskListItem[],
				done: [] as TaskListItem[],
				blocked: [] as TaskListItem[],
			};

			for (const task of res.data.data) {
				if (tasksByStatus[task.status]) {
					tasksByStatus[task.status].push(task as TaskListItem);
				}
			}

			return {
				columns: tasksByStatus,
				total: res.data.pagination.total,
			};
		},
	});
}

// Subtasks query
export function subtasksQueryOptions(
	parentTaskId: string,
	limit = 100,
	offset = 0,
) {
	return queryOptions({
		queryKey: [TASKS_QUERY_KEY, parentTaskId, "subtasks"],
		queryFn: async () => {
			const res = await apiClient.tasks({ id: parentTaskId }).subtasks.get({
				query: {
					limit,
					offset,
				},
			});
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

// Task stats query
export function taskStatsQueryOptions() {
	return queryOptions({
		queryKey: [TASKS_QUERY_KEY, "stats"],
		queryFn: async () => {
			const res = await apiClient.tasks.stats.get();
			if (res.error) throw res.error;
			return res.data;
		},
	});
}

// Mutations

// Create task mutation
export function useCreateTaskMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateTaskInput) => {
			const res = await apiClient.tasks.post(input);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
		},
	});
}

// Update task mutation
export function useUpdateTaskMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { id: string; data: UpdateTaskInput }) => {
			const res = await apiClient.tasks({ id: params.id }).put(params.data);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
			if (data?.data?.id) {
				queryClient.setQueryData([TASKS_QUERY_KEY, data.data.id], data);
			}
		},
	});
}

// Delete task mutation
export function useDeleteTaskMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (taskId: string) => {
			const res = await apiClient.tasks({ id: taskId }).delete();
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
		},
	});
}

// Reorder tasks mutation (for drag & drop)
export function useReorderTasksMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: ReorderTasksInput) => {
			const res = await apiClient.tasks.reorder.post(input);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
		},
	});
}

// Task assignment mutation
export function useAssignTaskMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { taskId: string; userId: string }) => {
			const res = await apiClient.tasks({ id: params.taskId }).assign.post({
				userId: params.userId,
			});
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
		},
	});
}

// Task status update mutation
export function useUpdateTaskStatusMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: { taskId: string; status: TaskStatus }) => {
			const res = await apiClient.tasks({ id: params.taskId }).status.post({
				status: params.status,
			});
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
		},
	});
}

// Add dependency mutation
export function useAddDependencyMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateDependencyInput) => {
			const res = await apiClient.tasks.dependencies.post(input);
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
		},
	});
}

// Remove dependency mutation
export function useRemoveDependencyMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (dependencyId: string) => {
			const res = await apiClient.tasks
				.dependencies({ id: dependencyId })
				.delete();
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
		},
	});
}
