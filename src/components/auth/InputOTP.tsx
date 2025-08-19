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
		className={cn('flex items-center', className || '')}
		{...props}
	/>
));
InputOTPGroup.displayName = 'InputOTPGroup';

const InputOTPSlot = React.forwardRef<
	React.ElementRef<'div'>,
	React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
	const inputOTPContext = React.useContext(OTPInputContext);
	const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

	return (
		<div
			ref={ref}
			className={cn(
				'relative flex items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md flex-1 h-10 min-w-10',
				isActive ? 'z-10 ring-2 ring-ring ring-offset-background' : '',
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
