'use client';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import Field from '@/components/Field';
import { fadeAnim } from '@/lib/animate';

import AuthContainer from './AuthContainer';
import { STATUS_SIGN_IN } from './index';

type SignUpType = {
	onSetPageStatus: (value: string) => void;
	className?: string;
};

const SignUp: React.FC<SignUpType> = ({ className, onSetPageStatus }) => {
	const [error, setError] = useState(false);
	const {
		handleSubmit,
		register,
		watch,
		reset,
		formState: { errors },
	} = useForm();

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log('🚀 ~ onSubmit ~ e:', e);
	};

	return (
		<AuthContainer
			type="sign-up"
			className="c-auth__sign-up"
			title="create your account"
		>
			<>
				<form className="c-auth__form" onSubmit={handleSubmit(onSubmit)}>
					<Field
						label="Email address"
						name="email"
						required={true}
						isFloatingLabel={true}
						{...register('email', {
							required: 'required',
							pattern: {
								value: /\S+@\S+\.\S+/,
								message: 'Entered value does not match email format',
							},
						})}
					/>
					<button className="btn btn--primary t-uppercase">enter</button>
				</form>
				{error && (
					<motion.div
						key="error"
						initial="hide"
						animate="show"
						exit="hide"
						variants={fadeAnim}
						className="form--error"
					>
						<div className="form--error-content">
							{error ? <p>{error}</p> : <p>Error!</p>}
							{/* <p className="form--error-reset">
								<button className="btn" onClick={(e) => resetForm(e)}>
									try again
								</button>
							</p> */}
						</div>
					</motion.div>
				)}
				<div className="c-auth__info">
					<p className="t-b-2">Already have an account?</p>
					<button
						type="button"
						className="cr-surface-sage c-auth__info-cta t-uppercase"
						onClick={() => onSetPageStatus(STATUS_SIGN_IN)}
					>
						Sign In
					</button>
				</div>
			</>
		</AuthContainer>
	);
};

export default SignUp;
