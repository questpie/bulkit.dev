import { cn } from "@bulkit/ui/lib";
import { SpinnerIcon } from "@phosphor-icons/react/ssr";

function Spinner({
	className,
	...props
}: React.ComponentProps<typeof SpinnerIcon>) {
	return (
		<SpinnerIcon
			strokeWidth={2}
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
