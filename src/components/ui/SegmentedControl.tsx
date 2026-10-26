'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';

import { cn } from '@/lib/utils';

export type Segment<T extends string> = { value: T; label: string };

/**
 * One choice of a few, in a pill track (Settings' Theme). A radiogroup: arrow keys move
 * the choice. Not for menus (MoreMenu keeps its own segments).
 */
export function SegmentedControl<T extends string>({
	label,
	options,
	value,
	onValueChange,
	className,
}: {
	/** Names the group for screen readers. */
	label: string;
	options: Segment<T>[];
	/** Undefined while the current one isn't known yet (e.g. the saved theme before hydration): nothing is checked. */
	value: T | undefined;
	onValueChange: (value: T) => void;
	className?: string;
}) {
	return (
		<RadioGroup
			aria-label={label}
			// null, not undefined, so the group stays controlled while nothing is checked
			value={value ?? null}
			onValueChange={(next) => {
				if (next !== null) onValueChange(next);
			}}
			className={cn('inline-flex rounded-full border border-border bg-muted p-0.5', className)}
		>
			{options.map((option) => (
				<Radio.Root
					key={option.value}
					value={option.value}
					className="inline-flex h-11 cursor-pointer items-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,box-shadow] outline-none select-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring data-checked:bg-card data-checked:text-foreground data-checked:shadow-xs md:h-[30px]"
				>
					{option.label}
				</Radio.Root>
			))}
		</RadioGroup>
	);
}
