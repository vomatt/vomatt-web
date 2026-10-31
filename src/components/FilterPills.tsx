'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type FilterOption<T extends string> = { value: T; label: string; count?: number };

/** A row of toggle pills where one is current (a list filter); the current one is ink. */
export function FilterPills<T extends string>({
	label,
	options,
	value,
	onChange,
	className,
}: {
	/** Names the group for screen readers. */
	label: string;
	options: FilterOption<T>[];
	/** Undefined while the current one isn't known yet (e.g. before hydration). */
	value: T | undefined;
	onChange: (value: T) => void;
	className?: string;
}) {
	return (
		<div role="group" aria-label={label} className={cn('flex flex-wrap gap-1.5', className)}>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<Button
						key={option.value}
						size="xs"
						variant={active ? 'default' : 'outline'}
						aria-pressed={active}
						onClick={() => onChange(option.value)}
						// No Button size is 30px; phones keep xs's 44px target
						className="rounded-full md:h-[30px]"
					>
						{option.label}
						{option.count !== undefined && (
							<span className={cn('tabular-nums', !active && 'text-muted-foreground')}>{option.count}</span>
						)}
					</Button>
				);
			})}
		</div>
	);
}
