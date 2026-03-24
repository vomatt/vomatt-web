'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Label({
	className,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				'flex items-center gap-2 text-sm leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
				className
			)}
			{...props}
		/>
	);
}

const FloatingLabel = React.forwardRef<
	React.ElementRef<typeof Label>,
	React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
	return (
		<Label
			className={cn(
				'absolute left-4 top-2 text-muted-foreground text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground/50 peer-placeholder-shown:top-6 peer-focus:top-2 peer-focus:text-muted-foreground peer-focus:text-sm ',
				className || ''
			)}
			ref={ref}
			{...props}
		/>
	);
});

FloatingLabel.displayName = 'FloatingLabel';

export { FloatingLabel,Label };
