import { type VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export function ButtonLoading({
	isLoading,
	children,
	className,
	variant,
	size,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		isLoading: boolean;
	}) {
	return (
		<Button className={className} variant={variant} size={size} {...props}>
			{children}
			{isLoading && <Spinner />}
		</Button>
	);
}
