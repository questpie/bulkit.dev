import { apiServer } from "@bulkit/app/api/api.server";
import { PageDescription } from "@bulkit/app/app/(main)/admin/_components/page-description";
import { Button } from "@bulkit/ui/components/ui/button";
import { PiRobot } from "react-icons/pi";
import {
	AIProviderForm,
	AIProviderFormTrigger,
} from "./_components/ai-provider-form";
import { AIProvidersTable } from "./_components/ai-providers-table";

export default async function AIProvidersPage() {
	const initialProviders = await apiServer.admin["ai-providers"].get();

	if (!initialProviders.data?.length) {
		return (
			<div className="p-6">
				<PageDescription
					title="AI Providers"
					description="Configure AI providers to enable text generation and other AI-powered features across the platform."
				/>
				<div className="flex flex-col items-center justify-center h-[400px] text-center">
					<PiRobot className="w-16 h-16 text-muted-foreground/40" />
					<h3 className="mt-4 text-lg font-medium">
						No AI providers configured
					</h3>
					<p className="mt-2 text-sm text-muted-foreground max-w-sm">
						AI providers enable AI-powered features like text generation and
						image creation. Add your first provider to get started.
					</p>
					<AIProviderForm mode="add">
						<AIProviderFormTrigger asChild>
							<Button className="mt-6">Add your first AI provider</Button>
						</AIProviderFormTrigger>
					</AIProviderForm>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<PageDescription
				title="AI Providers"
				description="Configure AI providers to enable text generation and other AI-powered features across the platform."
			/>
			<div className="flex justify-end mb-4">
				<AIProviderForm mode="add">
					<AIProviderFormTrigger asChild>
						<Button>Add Provider</Button>
					</AIProviderFormTrigger>
				</AIProviderForm>
			</div>
			<AIProvidersTable initialProviders={initialProviders.data} />
		</div>
	);
}
