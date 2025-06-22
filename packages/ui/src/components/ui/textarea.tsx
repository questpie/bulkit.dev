import { cn } from "@bulkit/ui/lib";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const textareaVariants = cva(
	"flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm  placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				outlined: "border border-input bg-background",
				filled: "bg-accent border-transparent",
			},
		},
		defaultVariants: {
			variant: "outlined",
		},
	},
);

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		VariantProps<typeof textareaVariants> {}

function Textarea({ className, variant, ...props }: TextareaProps) {
	return (
		<textarea
			className={cn(
				textareaVariants({
					variant,
					className,
				}),
			)}
			{...props}
		/>
	);
}

export { Textarea };
