'use client';
import Button from '@/components/Button';
import NextLink from 'next/link';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { getVerifyCode } from '@/app/api/login/getVerifyCode';
import HookFormField from '@/components/HookFormField';

import { VERIFICATION } from './index';

type SignInType = {
	onSetPageStatus: (value: string) => void;
	className?: string;
};

type FormValues = {
	email: string;
};

const SignIn: React.FC<SignInType> = ({ className, onSetPageStatus }) => {
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useForm();

	const onSubmit: SubmitHandler<FormValues> = async (data) => {
		const { email } = data;
		setIsLoading(true);
		try {
			const res = await getVerifyCode(email);
			if (res.status === 'success') {
				onSetPageStatus(VERIFICATION);
				return;
			}
		} catch (error) {
			console.log('🚀 ~ file: SignIn.tsx:36 ~ onSubmit ~ error:', error);
			setError('Something went wrong, pleas try again later');
		} finally {
			setIsLoading(false);
		}
	};

	return (
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
				<Button
					size="xg"
					className="w-full"
					type="submit"
					isLoading={isLoading}
				>
					Submit
				</Button>
			</form>
			<p className="t-b-2 text-center">
				Need help?{' '}
				<NextLink href="/contact" className="cr-grey-900 underline">
					Forgot password
				</NextLink>
			</p>
			<div className="mb-6 text-center">
				<div className="inline-flex items-center justify-center w-full">
					<hr className="w-64 h-px my-8 bg-grey-200 border-0 dark:bg-grey-700" />
					<span className="absolute px-2 font-medium -translate-x-1/2 text-white left-1/2 bg-black t-b-1">
						or
					</span>
				</div>
				<p className="t-b-2 text-center">
					Do not have an account?{' '}
					<NextLink href="/signup" className="cr-grey-900 underline">
						Sign up
					</NextLink>
				</p>
			</div>
		</>
	);
};

export default SignIn;
