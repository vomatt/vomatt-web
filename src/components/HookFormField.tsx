'use client';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

import { fadeAnim } from '@/lib/animate';

interface HookFormFieldProps extends React.ComponentPropsWithoutRef<'div'> {
	id?: string;
	name: string;
	type?: 'text' | 'email';
	label: string;
	className?: string;
	value?: string | number;
	errors?: any;
	isHideLabel?: boolean;
	isFloatingLabel?: boolean;
	required?: boolean;
	disabled?: boolean;
	register?: any;
	pattern?: {};
	onChange?: (e: React.FormEvent<HTMLInputElement>) => void;
}

export default function HookFormField({
	id,
	name,
	type = 'text',
	label,
	className,
	value,
	errors,
	isHideLabel,
	isFloatingLabel,
	required,
	disabled,
	onChange,
	register,
	pattern,
	...rest
}: HookFormFieldProps) {
	const [newValue, setNewValue] = useState<any | null>(value || '');
	const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		setNewValue(e.target.value);

		if (onChange) {
			onChange(e);
		}
	};

	return (
		<div
			className={cx('field is-floating-label', className, {
				'is-error': errors && errors[name],
			})}
		>
			<input
				type={type}
				name={name}
				id={id ? id : null}
				className={cx({
					'is-contain-value': newValue,
					'is-floating-label': isFloatingLabel,
				})}
				placeholder={label}
				required={required}
				disabled={disabled}
				onChange={register ? null : handleChange}
				{...register(name, {
					required: required,
					pattern,
				})}
				{...rest}
			/>
			<label
				className={cx({
					'screen-reader-only': isHideLabel,
				})}
				htmlFor={id ? id : null}
			>
				{label}
			</label>
			<AnimatePresence>
				{errors && errors[name] ? (
					<motion.p
						initial="hide"
						animate="show"
						exit="hide"
						variants={fadeAnim}
						className="error-message"
					>
						{errors[name].message}
					</motion.p>
				) : null}
			</AnimatePresence>
		</div>
	);
}
