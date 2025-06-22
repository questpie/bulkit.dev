import { apiClient } from "@bulkit/app/api/api.client";
import type { Platform } from "@bulkit/shared/constants/db.constants";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

export type OgCardPreviewProps = {
	url: string;
	platform?: Platform;
};

export function OgCardPreview({ url, platform }: OgCardPreviewProps) {
	const { data: ogResp } = useQuery({
		queryKey: ["ogData", url],
		queryFn: () =>
			apiClient.opengraph.get({
				query: {
					platform: platform ?? "facebook",
					url,
				},
			}),
	});

	if (!ogResp?.data) {
		return null;
	}

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="block no-underline"
		>
			<div className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
				{ogResp.data.image && (
					<div className="relative h-40">
						<Image
							src={ogResp.data.image}
							alt={ogResp.data.title ?? url}
							layout="fill"
							objectFit="cover"
						/>
					</div>
				)}
				<div className="p-4">
					<h3 className="text-lg font-semibold text-foreground mb-2">
						{ogResp.data.title ?? "No title"}
					</h3>
					<p className="text-sm text-muted-foreground line-clamp-2">
						{ogResp.data.description ?? "No description"}
					</p>
					<p className="text-xs text-muted-foreground mt-2">
						{new URL(url).hostname}
					</p>
				</div>
			</div>
		</a>
	);
}
