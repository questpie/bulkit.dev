"use client";

import { Button, type ButtonProps } from "@bulkit/ui/components/ui/button";
import { useAtom } from "jotai";
import { currentDateAtom } from "./calendar.atoms";
import { addMonths } from "date-fns";

type CalendarControlProps = ButtonProps;

export function CalendarControlPrevTrigger({
	className,
	...props
}: CalendarControlProps) {
	const [currentDate, setCurrentDate] = useAtom(currentDateAtom);

	return (
		<Button
			variant="outline"
			className={className}
			onClick={() => setCurrentDate(addMonths(currentDate, -1))}
			{...props}
		>
			{props.children ?? "Previous"}
		</Button>
	);
}

export function CalendarControlNextTrigger({
	className,
	...props
}: CalendarControlProps) {
	const [currentDate, setCurrentDate] = useAtom(currentDateAtom);

	return (
		<Button
			variant="outline"
			className={className}
			onClick={() => setCurrentDate(addMonths(currentDate, 1))}
			{...props}
		>
			{props.children ?? "Next"}
		</Button>
	);
}

export function CalendarControlTodayTrigger({
	className,
	...props
}: CalendarControlProps) {
	const [, setCurrentDate] = useAtom(currentDateAtom);
	return (
		<Button
			variant="outline"
			onClick={() => setCurrentDate(new Date())}
			{...props}
		>
			{props.children ?? "Today"}
		</Button>
	);
}
