import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				'border-input placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-card flex field-sizing-content min-h-16 w-full rounded-[10px] border px-3.5 py-2.5 text-body-2 transition-[color,background-color,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-body-3',
				className
			)}
			{...props}
		/>
	);
}

export { Textarea };
