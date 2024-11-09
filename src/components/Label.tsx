'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const labelVariants = cva(
	'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

const Label = React.forwardRef<
	HTMLLabelElement,
	React.LabelHTMLAttributes<HTMLLabelElement> &
		VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
	<label
		ref={ref}
		className={cn(labelVariants(), className || '')}
		{...props}
	/>
));

Label.displayName = 'Label';

const FloatingLabel = React.forwardRef<
	React.ElementRef<typeof Label>,
	React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
	return (
		<Label
			className={cn(
				'absolute left-4 top-2 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-6 peer-focus:top-2 peer-focus:text-gray-600 peer-focus:text-sm ',
				className || ''
			)}
			ref={ref}
			{...props}
		/>
	);
});

FloatingLabel.displayName = 'FloatingLabel';

export { Label, FloatingLabel };
