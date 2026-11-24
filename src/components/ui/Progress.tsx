'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const indicatorVariants = cva('h-full w-full origin-left transition-transform duration-300 ease-out-strong motion-reduce:transition-none', {
	variants: {
		variant: {
			default: 'bg-primary',
			// The voting window: time the seal holds, so it is Tide
			tide: 'bg-tide',
		},
	},
	defaultVariants: { variant: 'default' },
});

function Progress({
	className,
	variant,
	value,
	...props
}: ProgressPrimitive.Root.Props & VariantProps<typeof indicatorVariants>) {
	// Base UI's own percentage: clamped, on the min–max scale
	const { min = 0, max = 100 } = props;
	const fraction = value == null ? null : Math.min(Math.max((value - min) / (max - min), 0), 1);
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				'relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted',
				className
			)}
			value={value}
			{...props}
		>
			{/* Full width, scaled from the left: a transform animates without layout */}
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className={indicatorVariants({ variant })}
				style={fraction == null ? undefined : { width: '100%', transform: `scaleX(${fraction})` }}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
