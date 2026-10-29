import * as React from 'react';

import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<'input'> & {
	/** Fixed text inside the field before the value ("vomatt.com/"), mono and muted. */
	leading?: React.ReactNode;
};

function Input({ className, type, leading, ...props }: InputProps) {
	if (leading !== undefined) {
		return (
			// The group draws the field; the input inside stays bare and keeps the ref and props
			<div
				data-slot="input-group"
				className={cn(
					'border-input bg-card flex h-12 w-full min-w-0 items-center rounded-[10px] border px-3.5 text-[16px] transition-[color,background-color,border-color] has-disabled:cursor-not-allowed has-disabled:opacity-50 md:text-[15px]',
					'has-focus-visible:outline-2 has-focus-visible:outline-solid has-focus-visible:outline-offset-1 has-focus-visible:outline-ring',
					'has-aria-invalid:border-destructive'
				)}
			>
				<span className="text-muted-foreground shrink-0 font-mono select-none">{leading}</span>
				<input
					type={type}
					data-slot="input"
					className={cn(
						'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-full w-full min-w-0 bg-transparent outline-none disabled:pointer-events-none',
						className
					)}
					{...props}
				/>
			</div>
		);
	}

	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input bg-card flex h-12 w-full min-w-0 rounded-[10px] border px-3.5 py-1 text-[16px] transition-[color,background-color,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]',
				'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-ring',
				'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
				className
			)}
			{...props}
		/>
	);
}

export { Input };
