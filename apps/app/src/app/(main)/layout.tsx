import { AppLayout } from "@bulkit/app/app/(main)/_components/app-layout";
import { OrganizationGuard } from "@bulkit/app/app/(main)/organizations/_components/organization-guard";
import { PlanGuard } from "@bulkit/app/app/(main)/organizations/_components/plan-guard";
import type { PropsWithChildren } from "react";

export default async function MainLayout(props: PropsWithChildren) {
	return (
		<OrganizationGuard>
			<PlanGuard>
				{/* <div className="h-screen max-w-(--breakpoint-2xl) bg-background w-full mx-auto"> */}
				<AppLayout>{props.children}</AppLayout>
				{/* </div> */}
			</PlanGuard>
		</OrganizationGuard>
	);
}
