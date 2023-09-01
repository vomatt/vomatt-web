import React, { useState } from 'react';
import cx from 'classnames';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeAnim } from '@/lib/animate';

function Field({
	id,
	name,
	type = 'text',
	label,
	placeholder,
	className,
	value,
	errors,
	isHideLabel,
	isLabelAtTop,
	required,
	param,
}) {
	const [newValue, setValue] = useState(value);
	const handleChange = (e) => {
		let value = type == 'checkbox' ? e.target.checked : e.target.value;
		setValue(value);
	};

	const selectedDefault = Array.isArray(value)
		? (value.filter((el) => el.default == true) || value)[0]
		: false;
	const [selectedOption, setSelectedOption] = useState(
		type == 'select' ? selectedDefault?.value : false
	);
	const handleChangeSelect = (e) => {
		setSelectedOption(e.target.value);
	};

	const labelEl = (
		<label
			className={cx({
				'screen-reader-only': isHideLabel,
			})}
			htmlFor={id ? id : null}
		>
			{label ? label : name}
		</label>
	);
	const fieldEl = () => {
		switch (type) {
			case 'textarea':
				return (
					<textarea
						id={id ? id : null}
						className={cx({ 'is-contain-value': newValue })}
						value={newValue}
						required={required}
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
				// 	{
				// 		title: 'Option 3',
				// 		value: 'C',
				// 		disabled: true,
				// 	},
				// ]}
				return (
					<select
						id={id ? id : null}
						value={selectedOption}
						onChange={handleChangeSelect}
						required={required}
						{...param}
					>
						{value.map((el, i) => {
							return (
								<option key={i} value={el.value} disabled={el.disabled}>
									{el.title || el.value}
								</option>
							);
						})}
					</select>
				);

			case 'checkbox':
				return (
					<input
						id={id ? id : null}
						type="checkbox"
						checked={!!newValue}
						required={required}
						onChange={handleChange}
						{...param}
					/>
				);

			default:
				return (
					<input
						id={id ? id : null}
						className={cx({ 'is-contain-value': newValue })}
						type={type}
						value={newValue}
						placeholder={placeholder}
						required={required}
						onChange={handleChange}
						{...param}
					/>
				);
		}
	};

	return (
		<>
			<div
				className={cx('field', className, {
					'is-error': errors && errors[name],
					'is-not-inline-label':
						isHideLabel || isLabelAtTop || type == 'select',
				})}
			>
				{isLabelAtTop || (type == 'select' && labelEl)}
				{fieldEl()}
				{!isLabelAtTop && type != 'select' && labelEl}

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
		</>
	);
}

export default Field;
