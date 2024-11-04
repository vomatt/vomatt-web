import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import SvgIcons from '@/components/SvgIcons';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
	't-b-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-primary text-white hover:bg-primary/80',
				outline:
					'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
				secondary:
					'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-12 px-4 py-2 text-base [&_svg]:size-4',
				sm: 'h-8 rounded-md px-3 text-xs [&_svg]:size-3',
				md: 'h-10 rounded-md px-3 text-sm [&_svg]:size-3',
				lg: 'h-14 rounded-md px-8 text-lg [&_svg]:size-5',
				xg: 'h-16 rounded-md px-8 text-xl [&_svg]:size-6',
				icon: 'h-9 w-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ isLoading, className, variant, size, asChild, type = 'button', ...props },
		ref
	) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(
					buttonVariants({ variant, size, className }),
					isLoading ? 'pointer-events-none' : ''
				)}
				type={type}
				ref={ref}
				{...props}
			>
				{isLoading ? (
					<div className="flex justify-center items-center gap-3">
						<SvgIcons type="reload" className="animate-spin" />
						<span>Loading...</span>
					</div>
				) : (
					props.children
				)}
			</Comp>
		);
	}
);

Button.displayName = 'Button';

export default Button;
