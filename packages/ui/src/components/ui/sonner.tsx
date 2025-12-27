import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps, toast } from "sonner";
import {
	CheckCircleIcon,
	InfoIcon,
	SpinnerIcon,
	WarningIcon,
	XCircleIcon,
} from "@phosphor-icons/react";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group rounded-none"
			icons={{
				success: <CheckCircleIcon strokeWidth={2} className="size-4" />,
				info: <InfoIcon strokeWidth={2} className="size-4" />,
				warning: <WarningIcon strokeWidth={2} className="size-4" />,
				error: <XCircleIcon strokeWidth={2} className="size-4" />,
				loading: (
					<SpinnerIcon strokeWidth={2} className="size-4 animate-spin" />
				),
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: "cn-toast rounded-none!",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster, toast };
