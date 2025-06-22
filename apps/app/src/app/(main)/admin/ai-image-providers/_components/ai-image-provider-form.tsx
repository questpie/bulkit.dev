"use client";

import { apiClient } from "@bulkit/app/api/api.client";
import { useAppSettings } from "@bulkit/app/app/_components/app-settings-provider";
import { aiImageProvidersQueryOptions } from "@bulkit/app/app/(main)/admin/ai-image-providers/ai-image-providers.queries";
import {
	type AddAIImageProvider,
	AddAIImageProviderSchema,
	type UpdateAIImageProvider,
	UpdateAIImageProviderSchema,
} from "@bulkit/shared/modules/admin/schemas/ai-image-providers.schemas";
import {
	AI_IMAGE_CAPABILITIES,
	AI_IMAGE_PROVIDER_TYPES,
} from "@bulkit/shared/modules/app/app-constants";
import { formatCurrency } from "@bulkit/shared/utils/string";
import { Button } from "@bulkit/ui/components/ui/button";
import { Checkbox } from "@bulkit/ui/components/ui/checkbox";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@bulkit/ui/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@bulkit/ui/components/ui/sheet";
import { toast } from "@bulkit/ui/components/ui/sonner";
import useControllableState from "@bulkit/ui/hooks/use-controllable-state";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useForm, useWatch } from "react-hook-form";

type AIImageProviderFormProps = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	defaultValues?: Partial<AddAIImageProvider | UpdateAIImageProvider>;
	mode?: "add" | "edit";
};

export function AIImageProviderForm(
	props: PropsWithChildren<AIImageProviderFormProps>,
) {
	const [open, setOpen] = useControllableState({
		defaultValue: props.open ?? false,
		onChange: props.onOpenChange,
		value: props.open,
	});

	const appSettings = useAppSettings();
	const isCloud = appSettings.deploymentType === "cloud";

	const form = useForm<UpdateAIImageProvider | AddAIImageProvider>({
		resolver: typeboxResolver(
			props.mode === "edit"
				? UpdateAIImageProviderSchema
				: AddAIImageProviderSchema,
		),
		defaultValues: props.defaultValues || {
			name: "openai",
			model: "",
			capabilities: [],
			isActive: true,
			costPerImage: 0.01,
		},
	});

	const queryClient = useQueryClient();

	const editMutation = useMutation({
		mutationFn: async (values: UpdateAIImageProvider) => {
			console.log("values", values);
			const response = await apiClient.admin["ai-image-providers"].put({
				...values,
				apiKey: values.apiKey || undefined,
			});
			if (response.error) throw new Error(response.error.value.message);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: aiImageProvidersQueryOptions({}).queryKey,
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
		mutationFn: async (values: AddAIImageProvider) => {
			const response = await apiClient.admin["ai-image-providers"].post(values);
			if (response.error) throw new Error(response.error.value.message);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: aiImageProvidersQueryOptions({}).queryKey,
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
		if (props.mode === "edit")
			editMutation.mutate(values as UpdateAIImageProvider);
		else addMutation.mutate(values as AddAIImageProvider);
	});

	const costPerImage = useWatch({
		control: form.control,
		name: "costPerImage",
	});

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			{props.children}

			<SheetContent>
				<Form {...form}>
					<form
						onSubmit={handleSubmit}
						className="relative h-full flex flex-col gap-4"
					>
						<SheetHeader>
							<SheetTitle>
								{props.mode === "edit" ? "Edit" : "Add"} AI Image Provider
							</SheetTitle>
						</SheetHeader>

						<div className="flex flex-col flex-1 gap-4 overflow-auto">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Provider</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={props.mode === "edit"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a provider" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{AI_IMAGE_PROVIDER_TYPES.map((provider) => (
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
								name="model"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Model</FormLabel>
										<FormControl>
											<Input placeholder="Enter model name" {...field} />
										</FormControl>
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
													props.mode === "edit"
														? "Enter new API key"
														: "Enter API key"
												}
												{...field}
											/>
										</FormControl>
										{props.mode === "edit" && (
											<p className="text-xs text-muted-foreground">
												Leave empty to keep the current API key
											</p>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="capabilities"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Capabilities</FormLabel>
										<div className="space-y-2">
											{AI_IMAGE_CAPABILITIES.map((capability) => (
												<FormControl key={capability}>
													<div className="flex items-center space-x-2">
														<Checkbox
															checked={field.value.includes(capability)}
															onCheckedChange={(checked) => {
																const newValue = checked
																	? [...field.value, capability]
																	: field.value.filter((v) => v !== capability);
																field.onChange(newValue);
															}}
														/>
														<span className="text-sm">{capability}</span>
													</div>
												</FormControl>
											))}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center space-x-2">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<FormLabel className="mt-0!">Active</FormLabel>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							{isCloud && (
								<FormField
									control={form.control}
									name="costPerImage"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Cost Per Image</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={0}
													step="0.01"
													placeholder="Enter credits cost per image"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
												/>
											</FormControl>
											<p className="text-xs text-muted-foreground">
												{Number.isNaN(field.value)
													? "-"
													: formatCurrency(
															field.value,
															appSettings.currency,
														)}{" "}
												per image
											</p>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</div>

						<SheetFooter>
							<Button type="submit" className="w-full">
								{props.mode === "edit" ? "Update" : "Save"} Provider
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}

export const AIImageProviderFormTrigger = SheetTrigger;
