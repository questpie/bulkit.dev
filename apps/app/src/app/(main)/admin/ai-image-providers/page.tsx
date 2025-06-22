import { apiServer } from "@bulkit/app/api/api.server";
import { PageDescription } from "@bulkit/app/app/(main)/admin/_components/page-description";
import { Button } from "@bulkit/ui/components/ui/button";
import { PiImage } from "react-icons/pi";
import {
	AIImageProviderForm,
	AIImageProviderFormTrigger,
} from "./_components/ai-image-provider-form";
import { AIImageProvidersTable } from "./_components/ai-image-providers-table";

export default async function AIImageProvidersPage() {
	const initialProviders = await apiServer.admin["ai-image-providers"].get();

	if (!initialProviders.data?.length) {
		return (
			<div className="p-6">
				<PageDescription
					title="AI Image Providers"
					description="Configure AI providers to enable image generation and other AI-powered image features across the platform."
				/>
				<div className="flex flex-col items-center justify-center h-[400px] text-center">
					<PiImage className="w-16 h-16 text-muted-foreground/40" />
					<h3 className="mt-4 text-lg font-medium">
						No AI image providers configured
					</h3>
					<p className="mt-2 text-sm text-muted-foreground max-w-sm">
						AI image providers enable AI-powered features like image generation.
						Add your first provider to get started.
					</p>
					<AIImageProviderForm mode="add">
						<AIImageProviderFormTrigger asChild>
							<Button className="mt-6">Add your first AI image provider</Button>
						</AIImageProviderFormTrigger>
					</AIImageProviderForm>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<PageDescription
				title="AI Image Providers"
				description="Configure AI providers to enable image generation and other AI-powered image features across the platform."
			/>
			<div className="flex justify-end mb-4">
				<AIImageProviderForm mode="add">
					<AIImageProviderFormTrigger asChild>
						<Button>Add Provider</Button>
					</AIImageProviderFormTrigger>
				</AIImageProviderForm>
			</div>
			<AIImageProvidersTable initialProviders={initialProviders.data} />
		</div>
	);
}
