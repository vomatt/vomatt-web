'use client';

import { type ReactNode, useId } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type PillGroupProps<T extends string> = {
	legend: string;
	legendClassName?: string;
	/** Beside the legend, e.g. who sees the choice; not part of the group's name. */
	aside?: ReactNode;
	/** Under the legend. */
	note?: string;
	/** Under the pills, e.g. what the chosen one means. */
	hint?: string;
	/** Undefined while nothing is chosen. */
	value: T | undefined;
	onChange: (value: T) => void;
	options: { value: T; label: string }[];
};

/** One choice of a few, as toggle pills that wrap. */
export function PillGroup<T extends string>({
	legend,
	legendClassName = 'text-body-4 leading-snug font-medium',
	aside,
	note,
	hint,
	value,
	onChange,
	options,
}: PillGroupProps<T>) {
	const legendId = useId();
	const noteId = useId();
	const hintId = useId();
	const describedBy = [note && noteId, hint && hintId].filter(Boolean).join(' ') || undefined;
	const label = (
		<span id={legendId} className={cn('block', legendClassName)}>
			{legend}
		</span>
	);
	return (
		<div role="group" aria-labelledby={legendId} aria-describedby={describedBy}>
			{aside ? (
				<div className="flex min-h-7 items-center justify-between gap-2">
					{label}
					{aside}
				</div>
			) : (
				label
			)}
			{note && (
				<p id={noteId} className="mt-0.5 text-caption-1 text-muted-foreground">
					{note}
				</p>
			)}
			<div className="mt-3 flex flex-wrap gap-2">
				{options.map((option) => (
					<Button
						key={option.value}
						type="button"
						size="sm"
						variant={option.value === value ? 'default' : 'outline'}
						aria-pressed={option.value === value}
						className="rounded-full"
						onClick={() => onChange(option.value)}
					>
						{option.label}
					</Button>
				))}
			</div>
			{hint && (
				<p id={hintId} className="mt-2 text-caption-1 text-muted-foreground">
					{hint}
				</p>
			)}
		</div>
	);
}
