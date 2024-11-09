import * as React from 'react';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
	'px-4 pb-2.5 pt-2.5 flex w-full rounded-md border border-gray-300 bg-transparent transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'text-white',
				error: 'border-red-700 focus:border-red-700',
			},
			inputSize: {
				sm: 'h-10',
				default: 'h-14',
				md: 'h-16',
				lg: 'h-18',
			},
		},
		defaultVariants: {
			variant: 'default',
			inputSize: 'default',
		},
	}
);

interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement>,
		VariantProps<typeof inputVariants> {
	type: string;
	inputSize?: 'default' | 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ variant, inputSize, className, type = 'text', ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(inputVariants({ variant, inputSize }), className || '')}
				ref={ref}
				{...props}
			/>
		);
	}
);

Input.displayName = 'Input';

export { Input };
