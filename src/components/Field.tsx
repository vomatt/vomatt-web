'use client';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

import { fadeAnim } from '@/lib/animate';

type FieldType = {
	id?: string;
	name: string;
	type?: 'text' | 'email' | 'checkbox' | 'select' | 'textarea';
	label: string;
	placeholder?: string;
	className?: string;
	value?: string | number;
	errors?: any;
	isHideLabel?: boolean;
	isFloatingLabel?: boolean;
	required?: boolean;
	disabled?: boolean;
	param?: any;
	onChange?: (e: React.FormEvent<HTMLInputElement>) => void;
};

const Field: React.FC<FieldType> = ({
	id,
	name,
	type = 'text',
	label,
	placeholder,
	className,
	value,
	errors,
	isHideLabel,
	isFloatingLabel,
	required,
	disabled,
	param,
	onChange,
}) => {
	const [newValue, setNewValue] = useState<any | null>(value);
	const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		let value = type == 'checkbox' ? e.target.checked : e.target.value;
		setNewValue(value);

		if (onChange) {
			onChange(e);
		}
	};

	const selectedDefault = Array.isArray(value)
		? (value.filter((el) => el.default == true) || value)[0]
		: false;
	const [selectedValue, setSelectedValue] = useState(
		type == 'select' ? selectedDefault?.value || selectedDefault?.title : false
	);
	const handleChangeSelect: React.ChangeEventHandler<HTMLInputElement> = (
		e
	) => {
		setSelectedValue(e.target.value);

		if (onChange) {
			onChange(e);
		}
	};

	const labelEl = () => {
		return (
			<label
				className={cx({
					'screen-reader-only': isHideLabel,
				})}
				htmlFor={id ? id : null}
			>
				{label ? label : name}
			</label>
		);
	};
	const fieldEl = () => {
		switch (type) {
			case 'textarea':
				return (
					<textarea
						name={name}
						id={id ? id : null}
						className={cx({ 'is-contain-value': newValue })}
						value={newValue || value}
						required={required}
						disabled={disabled}
						onChange={handleChange}
						{...param}
					></textarea>
				);
			case 'select':
				// example value:
				// value={[
				// 	{
				// 		title: 'Option 1',
				// 		value: 'A',
				// 	},
				// 	{
				// 		title: 'Option 2',
				// 		value: 'B',
				// 		default: true,
				// 	},
				// ]}
				return (
					<select
						name={name}
						id={id ? id : null}
						className={cx({
							'is-contain-value':
								selectedValue !=
								(selectedDefault?.value || selectedDefault?.title),
						})}
						value={selectedValue}
						onChange={handleChangeSelect}
						required={required}
						disabled={disabled}
						{...param}
					>
						{Array.isArray(value)
							? value.map((el, i) => {
									return (
										<option
											key={i}
											value={el.value}
											disabled={
												selectedDefault == el
													? el.disabled && selectedValue
													: el.disabled
											}
										>
											{el.title || el.value}
										</option>
									);
							  })
							: ''}
					</select>
				);

			case 'checkbox':
				return (
					<input
						type="checkbox"
						name={name}
						id={id ? id : null}
						checked={!!newValue}
						required={required}
						disabled={disabled}
						onChange={handleChange}
						{...param}
					/>
				);

			default:
				return (
					<input
						type={type}
						name={name}
						id={id ? id : null}
						className={cx({ 'is-contain-value': newValue })}
						value={newValue || value}
						placeholder={placeholder}
						required={required}
						disabled={disabled}
						onChange={handleChange}
						{...param}
					/>
				);
		}
	};

	return (
		<div
			className={cx('field', className, {
				'is-error': errors && errors[name],
				'is-floating-label':
					!isHideLabel && type == 'select' && isFloatingLabel,
			})}
		>
			{(!isFloatingLabel || type == 'select') && labelEl()}
			{fieldEl()}
			{isFloatingLabel && type != 'select' && labelEl()}

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
};

export default Field;
