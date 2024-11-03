import * as React from 'react';

import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { cn } from '@/lib/utils';

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const FloatingInput = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type = 'text', ...props }, ref) => {
		return (
			<Input
				type={type}
				placeholder=" "
				className={cn('pt-6 placeholder-transparent peer', className || '')}
				ref={ref}
				{...props}
			/>
		);
	}
);

FloatingInput.displayName = 'FloatingInput';

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

type FloatingLabelInputProps = InputProps & { label?: string };

const FloatingLabelInput = React.forwardRef<
	React.ElementRef<typeof FloatingInput>,
	React.PropsWithoutRef<FloatingLabelInputProps>
>(({ id, label, ...props }, ref) => {
	return (
		<div className="relative">
			<FloatingInput ref={ref} id={id} {...props} />
			<FloatingLabel htmlFor={id}>{label}</FloatingLabel>
		</div>
	);
});
FloatingLabelInput.displayName = 'FloatingLabelInput';

export { FloatingInput, FloatingLabel, FloatingLabelInput };
