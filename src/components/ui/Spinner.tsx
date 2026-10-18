import { Loader2 } from '@/components/ui/SvgIcons';
import { cn } from '@/lib/utils';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
	return (
		<Loader2
			role="status"
			aria-label="Loading"
			className={cn('size-4 animate-spin motion-reduce:animate-[spin_1.6s_linear_infinite]', className)}
			{...props}
		/>
	);
}

export { Spinner };
