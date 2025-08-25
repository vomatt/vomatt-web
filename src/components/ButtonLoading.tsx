import { type VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/Button';

export function ButtonLoading({
	isLoading,
	children,
	className,
	variant,
	size,
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		isLoading: boolean;
	}) {
	return (
		<Button
			disabled={isLoading}
			className={className}
			variant={variant}
			size={size}
		>
			{isLoading && <Loader2Icon className="animate-spin" />}
			{children}
		</Button>
	);
}
