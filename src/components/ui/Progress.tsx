'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const indicatorVariants = cva('h-full transition-all', {
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
	...props
}: ProgressPrimitive.Root.Props & VariantProps<typeof indicatorVariants>) {
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				'relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted',
				className
			)}
			{...props}
		>
			{/* Base UI sizes the indicator with an inline width from `value` */}
			<ProgressPrimitive.Indicator data-slot="progress-indicator" className={indicatorVariants({ variant })} />
		</ProgressPrimitive.Root>
	);
}

export { Progress };
