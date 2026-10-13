'use client';

import { OTPInput, OTPInputContext } from 'input-otp';
import * as React from 'react';

import { cn } from '@/lib/utils';

const InputOTP = React.forwardRef<
	React.ElementRef<typeof OTPInput>,
	React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
	<OTPInput
		ref={ref}
		containerClassName={cn(
			'flex items-center gap-2 has-disabled:opacity-50',
			containerClassName || ''
		)}
		className={cn('disabled:cursor-not-allowed', className || '')}
		{...props}
	/>
));
InputOTP.displayName = 'InputOTP';

const InputOTPGroup = React.forwardRef<
	React.ElementRef<'div'>,
	React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn('flex flex-1 items-center gap-2', className || '')}
		{...props}
	/>
));
InputOTPGroup.displayName = 'InputOTPGroup';

const InputOTPSlot = React.forwardRef<
	React.ElementRef<'div'>,
	React.ComponentPropsWithoutRef<'div'> & { index: number; invalid?: boolean }
>(({ index, invalid = false, className, ...props }, ref) => {
	const inputOTPContext = React.useContext(OTPInputContext);
	const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

	return (
		<div
			ref={ref}
			className={cn(
				'relative flex h-14 min-w-0 flex-1 items-center justify-center rounded-lg border bg-field font-mono text-xl transition-[border-color,box-shadow]',
				invalid ? 'border-destructive' : 'border-border-strong',
				isActive && !invalid && 'z-10 bg-card border-foreground shadow-[0_0_0_3px_var(--volt-tint)]',
				className || ''
			)}
			{...props}
		>
			{char}
			{hasFakeCaret && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
				</div>
			)}
		</div>
	);
});

InputOTPSlot.displayName = 'InputOTPSlot';

const InputOTPSeparator = React.forwardRef<
	React.ElementRef<'div'>,
	React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
	<div ref={ref} role="separator" {...props}>
		<svg
			width="15"
			height="15"
			viewBox="0 0 15 15"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M5 7.5C5 7.22386 5.22386 7 5.5 7H9.5C9.77614 7 10 7.22386 10 7.5C10 7.77614 9.77614 8 9.5 8H5.5C5.22386 8 5 7.77614 5 7.5Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			></path>
		</svg>
	</div>
));

InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
