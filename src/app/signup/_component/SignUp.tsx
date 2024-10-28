'use client';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import Button from '@/components/Button';
import CustomPortableText from '@/components/CustomPortableText';
import HookFormField from '@/components/HookFormField';
import { fadeAnim } from '@/lib/animate';

import AuthContainer from '@/components/auth/AuthContainer';
import NextLink from 'next/link';

interface SignUpProps {
	className?: string;
	signUpInfoData: any;
}

type FormValues = {
	email: string;
};

const SignUp: React.FC<SignUpProps> = ({ className, signUpInfoData }) => {
	const { policyMessage } = signUpInfoData || {};
	const [error, setError] = useState(false);
	const {
		handleSubmit,
		register,
		watch,
		reset,
		formState: { errors },
	} = useForm();

	const onSubmit: SubmitHandler<FormValues> = async (data) => {
		const { email } = data;
	};

	return (
		<AuthContainer
			type="sign-up"
			className="c-auth__sign-up"
			title="create your account"
		>
			<>
				<form className="mb-12" onSubmit={handleSubmit(onSubmit)}>
					<HookFormField
						label="Name"
						name="name"
						type="text"
						required={true}
						pattern={{
							value: /^[a-z ,.'-]+$/i,
							message: 'Please enter a valid name.',
						}}
						register={register}
						errors={errors}
					/>
					<HookFormField
						label="Email address"
						name="email"
						type="email"
						register={register}
						required={true}
						pattern={{
							value: /\S+@\S+\.\S+/,
							message: 'Please enter a valid email.',
						}}
						errors={errors}
					/>
					<Button size="xg" className="w-full uppercase">
						enter
					</Button>
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

				<div className="mb-3">
					<CustomPortableText blocks={policyMessage} />
				</div>

				<p className="t-b-1 text-center">
					Already have an account?{' '}
					<NextLink href="/" className="cr-grey-900 underline">
						Sign In
					</NextLink>
				</p>
			</>
		</AuthContainer>
	);
};

export default SignUp;
