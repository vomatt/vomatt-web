import * as React from 'react';

import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

type InputSize = 'default' | 'md' | 'lg';
interface FloatingInputBaseProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	inputSize?: InputSize;
	error?: string;
}

const labelVariants = cva(
	'absolute left-4 text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:text-gray-600 peer-focus:text-xs ',
	{
		variants: {
			variant: {
				default: 'text-white',
				error: 'text-red-700',
			},
			inputSize: {
				default:
					'top-1.5 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-sm ',
				md: 'top-2 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-focus:top-2 peer-focus:text-sm ',
				lg: 'top-2 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:top-6 peer-focus:top-2 peer-focus:text-sm ',
			},
		},
		defaultVariants: {
			variant: 'default',
			inputSize: 'default',
		},
	}
);

const FloatingInput = React.forwardRef<
	HTMLInputElement,
	FloatingInputBaseProps
>(({ className, type = 'text', error, ...props }, ref) => {
	const inputClasses = cn('pt-6 placeholder-transparent peer', className || '');
	return (
		<Input
			type={type}
			placeholder=" "
			inputSize={props.inputSize}
			variant={error ? 'error' : 'default'}
			className={inputClasses}
			ref={ref}
			{...props}
		/>
	);
});

FloatingInput.displayName = 'FloatingInput';

interface FloatingLabelProps
	extends React.ComponentPropsWithoutRef<typeof Label>,
		VariantProps<typeof labelVariants> {
	inputSize?: InputSize;
	error?: boolean;
}

const FloatingLabel = React.forwardRef<
	React.ElementRef<typeof Label>,
	FloatingLabelProps
>(({ className, variant, inputSize = 'default', error, ...props }, ref) => {
	const labelClasses = cn(
		labelVariants({
			variant: error ? 'error' : variant,
			inputSize,
		}),
		className || ''
	);

	return <Label ref={ref} className={labelClasses} {...props} />;
});

FloatingLabel.displayName = 'FloatingLabel';

interface FloatingLabelInputProps extends FloatingInputBaseProps {
	label: string;
	error?: string;
}

const FloatingLabelInput = React.forwardRef<
	HTMLInputElement,
	FloatingLabelInputProps
>(({ id, label, ...props }, ref) => {
	return (
		<div className="relative">
			<FloatingInput ref={ref} id={id} {...props} />
			<FloatingLabel htmlFor={id} inputSize={props.inputSize || 'default'}>
				{label}
			</FloatingLabel>
		</div>
	);
});

FloatingLabelInput.displayName = 'FloatingLabelInput';

export { FloatingInput, FloatingLabel, FloatingLabelInput };
