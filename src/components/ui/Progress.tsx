'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';

import { cn } from '@/lib/utils';

function Progress({ className, ...props }: ProgressPrimitive.Root.Props) {
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
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className="h-full bg-primary transition-all"
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
