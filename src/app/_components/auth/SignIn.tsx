'use client';
import Button from '@/components/Button';
import NextLink from 'next/link';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { getVerifyCode } from '@/app/api/login/getVerifyCode';
import HookFormField from '@/components/HookFormField';

import AuthContainer from './AuthContainer';
import { STATUS_SIGN_UP, VERIFICATION } from './index';

type SignInType = {
	onSetPageStatus: (value: string) => void;
	className?: string;
};

type FormValues = {
	email: string;
};

const SignIn: React.FC<SignInType> = ({ className, onSetPageStatus }) => {
	const [error, setError] = useState(null);

	const {
		handleSubmit,
		register,

		formState: { errors },
	} = useForm();

	const onSubmit: SubmitHandler<FormValues> = async (data) => {
		const { email } = data;

		try {
			const res = await getVerifyCode(email);
			if (res.status === 'success') {
				onSetPageStatus(VERIFICATION);
				return;
			}
		} catch (error) {
			console.log('🚀 ~ file: SignIn.tsx:36 ~ onSubmit ~ error:', error);
			setError('Something went wrong, pleas try again later');
		}
	};

	return (
		<AuthContainer
			type="sign-up"
			className="c-auth__sign-in h-"
			title="Sign In"
		>
			<>
				<form onSubmit={handleSubmit(onSubmit)} className="mb-10">
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
					<Button size="xg" className="w-full">
						Submit
					</Button>
				</form>
				<div className="mb-6 text-center">
					<div className="inline-flex items-center justify-center w-full">
						<hr className="w-64 h-px my-8 bg-grey-200 border-0 dark:bg-grey-700" />
						<span className="absolute px-3 font-medium -translate-x-1/2 text-white left-1/2 bg-black t-b-1">
							or
						</span>
					</div>
					<Button
						className="w-full"
						size="xg"
						onClick={() => onSetPageStatus(STATUS_SIGN_UP)}
					>
						Sign Up
					</Button>
				</div>
				<p className="t-b-2 text-center">
					Need help?{' '}
					<NextLink href="/contact" className="cr-grey-900 underline">
						Contact support
					</NextLink>
				</p>
			</>
		</AuthContainer>
	);
};

export default SignIn;
