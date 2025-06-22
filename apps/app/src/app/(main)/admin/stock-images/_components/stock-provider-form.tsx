"use client";
import { apiClient } from "@bulkit/app/api/api.client";
import { stockProvidersQueryOptions } from "@bulkit/app/app/(main)/admin/stock-images/stock-providers.queries";
import {
	type AddStockImageProvider,
	AddStockImageProviderSchema,
	type UpdateStockImageProvider,
	UpdateStockImageProviderSchema,
} from "@bulkit/shared/modules/admin/schemas/stock-image-providers.schemas";
import { STOCK_IMAGE_PROVIDER_TYPES } from "@bulkit/shared/modules/app/app-constants";
import { Button } from "@bulkit/ui/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@bulkit/ui/components/ui/form";
import { Input } from "@bulkit/ui/components/ui/input";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "@bulkit/ui/components/ui/responsive-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@bulkit/ui/components/ui/select";
import { toast } from "@bulkit/ui/components/ui/sonner";
import useControllableState from "@bulkit/ui/hooks/use-controllable-state";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useForm } from "react-hook-form";

type StockProviderFormProps = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	defaultValues?: UpdateStockImageProvider | AddStockImageProvider;
	mode?: "add" | "edit";
};

export function StockProviderForm({
	defaultValues,
	mode = "add",
	...props
}: PropsWithChildren<StockProviderFormProps>) {
	const [open, setOpen] = useControllableState({
		defaultValue: props.open ?? false,
		onChange: props.onOpenChange,
		value: props.open,
	});

	const form = useForm<UpdateStockImageProvider | AddStockImageProvider>({
		resolver: typeboxResolver(
			mode === "edit"
				? UpdateStockImageProviderSchema
				: AddStockImageProviderSchema,
		),
		defaultValues: defaultValues || {
			id: "unsplash",
		},
	});

	const queryClient = useQueryClient();

	const editMutation = useMutation({
		mutationFn: async (values: UpdateStockImageProvider) => {
			const response = await apiClient.admin["stock-image-providers"].put({
				...values,
				apiKey: values.apiKey || undefined,
			});
			if (response.error) throw new Error(response.error.value.message);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: stockProvidersQueryOptions({}).queryKey,
			});
			setOpen(false);
			toast.success("Provider updated successfully");
		},
		onError: (error) => {
			toast.error("Failed to update provider", {
				description: error.message,
			});
		},
	});

	const addMutation = useMutation({
		mutationFn: async (values: AddStockImageProvider) => {
			const response =
				await apiClient.admin["stock-image-providers"].post(values);
			if (response.error) throw new Error(response.error.value.message);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: stockProvidersQueryOptions({}).queryKey,
			});
			setOpen(false);
			toast.success("Provider added successfully");
		},
		onError: (error) => {
			toast.error("Failed to add provider", {
				description: error.message,
			});
		},
	});

	const handleSubmit = form.handleSubmit((values) => {
		if (mode === "edit")
			editMutation.mutate(values as UpdateStockImageProvider);
		else addMutation.mutate(values as AddStockImageProvider);
	});

	return (
		<ResponsiveDialog open={open} onOpenChange={setOpen}>
			{props.children}

			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>
						{mode === "edit" ? "Edit" : "Add"} Stock Image Provider
					</ResponsiveDialogTitle>
				</ResponsiveDialogHeader>

				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-4">
						<FormField
							control={form.control}
							name="id"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Provider</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										disabled={mode === "edit"}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a provider" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{STOCK_IMAGE_PROVIDER_TYPES.map((provider) => (
												<SelectItem key={provider} value={provider}>
													{provider}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="apiKey"
							render={({ field }) => (
								<FormItem>
									<FormLabel>API Key</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder={
												mode === "edit" ? "Enter new API key" : "Enter API key"
											}
											{...field}
										/>
									</FormControl>
									{mode === "edit" && (
										<p className="text-xs text-muted-foreground">
											Leave empty to keep the current API key
										</p>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit" className="w-full">
							{mode === "edit" ? "Update" : "Save"} Provider
						</Button>
					</form>
				</Form>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

export const StockProviderFormTrigger = ResponsiveDialogTrigger;
