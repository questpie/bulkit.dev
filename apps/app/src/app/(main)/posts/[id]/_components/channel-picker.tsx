import { apiClient } from "@bulkit/app/api/api.client";
import { PLATFORM_ICON } from "@bulkit/app/app/(main)/channels/channels.constants";
import type { PostType } from "@bulkit/shared/constants/db.constants";
import type { PostChannelSchema } from "@bulkit/shared/modules/posts/posts.schemas";
import { dedupe } from "@bulkit/shared/types/data";
import { capitalize } from "@bulkit/shared/utils/string";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@bulkit/ui/components/ui/avatar";
import { Button } from "@bulkit/ui/components/ui/button";
import { Card } from "@bulkit/ui/components/ui/card";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "@bulkit/ui/components/ui/responsive-dialog";
import { useDebouncedValue } from "@bulkit/ui/hooks/use-debounce";
import { cn } from "@bulkit/ui/lib";
import type { Static } from "@sinclair/typebox";
import { useInfiniteQuery } from "@tanstack/react-query";
import type React from "react";
import { useMemo, useState } from "react";
import { PiPlus } from "react-icons/pi";

type Channel = Static<typeof PostChannelSchema>;

const FIRST_ROW_ITEMS_COUNT = 12;

type ChannelPickerProps = {
	value: Channel[];
	onValueChange: (value: Channel[]) => void;
	postType?: PostType;
	isDisabled?: boolean;
};

const ChannelPicker: React.FC<ChannelPickerProps> = ({
	value,
	onValueChange,
	postType,
	isDisabled,
}) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const [searchQuery, setSearchQuery] = useState<string>("");
	const debouncedQuery = useDebouncedValue(searchQuery, 200);

	const channelsQuery = useInfiniteQuery({
		queryKey: ["channels-infinite-query", debouncedQuery, postType],
		queryFn: (opts) => {
			return apiClient.channels.get({
				query: {
					limit: 50,
					cursor: opts.pageParam,
					q: debouncedQuery,
					postType,
				},
			});
		},
		enabled: !isDisabled,
		initialPageParam: 0,
		getNextPageParam: (prev) => prev.data?.nextCursor,
	});

	const valueMap = useMemo(() => {
		return value.reduce(
			(acc, curr) => {
				acc[curr.id] = curr;
				return acc;
			},
			{} as Record<string, Channel>,
		);
	}, [value]);

	// show all selected, if there are less than 5 selected, show first 5 - selected channels + add button
	const queryFlatData = useMemo(
		() =>
			(channelsQuery.data?.pages.flatMap((p) => p.data?.data ?? []) ?? []).map(
				(p) => {
					return {
						...p,
						scheduledPost: {
							id: "_new",
							parentPostId: null,
							parentPostSettings: null,
							publishedAt: null,
							repostSettings: null,
							scheduledAt: null,
							failedAt: null,
							status: "scheduled",
							failureReason: null,
							startedAt: null,
						},
					} satisfies Channel;
				},
			),
		[channelsQuery.data],
	);

	const firstRow = useMemo(() => {
		const firstRow: Channel[] = [...value];
		if (firstRow.length < FIRST_ROW_ITEMS_COUNT) {
			let remaining = FIRST_ROW_ITEMS_COUNT - firstRow.length;
			for (const qItem of queryFlatData) {
				if (remaining === 0) break;
				if (!valueMap[qItem.id]) {
					firstRow.push(qItem);
					remaining--;
				}
			}
		}
		firstRow.sort((a, b) => a.name.localeCompare(b.name));
		return firstRow;
	}, [queryFlatData, value, valueMap]);

	const dialogList = useMemo(
		() => dedupe([...value, ...queryFlatData], (i) => i.id),
		[queryFlatData, value],
	);

	return (
		<ResponsiveDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
				{firstRow.map((channel) => {
					const isSelected = !!value.find((v) => v.id === channel.id);

					const Icon = PLATFORM_ICON[channel.platform];

					return (
						<button
							type="button"
							key={channel.id}
							className="relative cursor-pointer focus:outline-ring disabled:pointer-events-none"
							onClick={() => {
								const newValue = isSelected
									? value.filter((v) => v.id !== channel.id)
									: [...value, channel];
								onValueChange(newValue);
							}}
							disabled={isDisabled}
						>
							<Avatar
								className={cn(
									"border-[3px] border-border size-12 transition-colors",
									isSelected && "border-primary",
								)}
							>
								<AvatarImage src={channel.imageUrl ?? undefined} />
								<AvatarFallback>{capitalize(channel.name[0]!)}</AvatarFallback>
							</Avatar>
							<div
								className={cn(
									"absolute -bottom-2 -right-2 border transition-colors rounded-full size-7 flex bg-card justify-center items-center  border-border ",
									isSelected && "bg-primary border-primary/50 ",
								)}
							>
								<Icon
									className={cn(
										"text-foreground size-4 transition-opacity",

										isSelected && "text-primary-foreground",
									)}
								/>
							</div>
						</button>
					);
				})}

				{queryFlatData.length > value.length &&
					queryFlatData.length > FIRST_ROW_ITEMS_COUNT && (
						<ResponsiveDialogTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="size-12 rounded-full"
								disabled={isDisabled}
							>
								<PiPlus className="size-5" />
							</Button>
						</ResponsiveDialogTrigger>
					)}
			</div>

			<ResponsiveDialogContent className="flex flex-col gap-4">
				<ChannelDialogList
					value={value}
					onValueChange={(internalSelected) => {
						setSearchQuery("");
						setIsDialogOpen(false);
						onValueChange(internalSelected);
					}}
					allChannelsList={dialogList}
					hasNextPage={!!channelsQuery.hasNextPage}
					fetchNextPage={channelsQuery.fetchNextPage}
				/>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
};

type ChannelDialogListProps = {
	value: Channel[];
	onValueChange: (channels: Channel[]) => void;

	allChannelsList: Channel[];
	hasNextPage?: boolean;
	fetchNextPage?: () => void;
};
export function ChannelDialogList(props: ChannelDialogListProps) {
	const [internalSelected, setInternalSelected] = useState(props.value);

	return (
		<div className="flex flex-col gap-5">
			<ResponsiveDialogHeader>
				<ResponsiveDialogTitle>Your channels</ResponsiveDialogTitle>
			</ResponsiveDialogHeader>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 px-4 gap-4">
				{props.allChannelsList.map((channel) => {
					const isSelected = !!internalSelected.find(
						(v) => v.id === channel.id,
					);
					const Icon = PLATFORM_ICON[channel.platform];
					return (
						<Card
							key={channel.id}
							className={cn(
								"p-4 flex flex-col transition-colors items-center cursor-pointer hover:bg-secondary/70 text-center justify-center gap-2 relative",
								isSelected && "border-primary bg-primary/20 text-primary",
							)}
							onClick={() => {
								setInternalSelected((prev) => {
									const isSelected = !!prev.find((v) => v.id === channel.id);
									if (isSelected) {
										return prev.filter((v) => v.id !== channel.id);
									}
									return [...prev, channel];
								});
							}}
						>
							<Avatar key={channel.id}>
								<AvatarImage src={channel.imageUrl ?? undefined} />
								<AvatarFallback>{capitalize(channel.name[0]!)}</AvatarFallback>
							</Avatar>
							<span className="text-sm font-bold line-clamp-1 w-full text-ellipsis">
								{channel.name}
							</span>
							<div
								className={cn(
									"absolute -top-2 -right-2 border transition-colors rounded-full size-8 flex flex-col justify-center items-center bg-background border-border",
									isSelected && "bg-primary border-primary/50",
								)}
							>
								<Icon
									className={cn(
										"text-foreground size-5 transition-opacity",
										isSelected && "text-primary-foreground",
									)}
								/>
							</div>
						</Card>
					);
				})}
			</div>
			{props.hasNextPage && (
				<div>
					<Button
						type="button"
						variant="outline"
						className="w-full md:w-auto"
						onClick={() => props.fetchNextPage?.()}
					>
						Load more
					</Button>
				</div>
			)}

			<ResponsiveDialogFooter>
				<Button
					type="button"
					onClick={() => {
						props.onValueChange(internalSelected);
					}}
				>
					Apply
				</Button>
			</ResponsiveDialogFooter>
		</div>
	);
}

export default ChannelPicker;
