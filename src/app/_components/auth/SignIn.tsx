'use client';
import cx from 'classnames';
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
        (<AuthContainer type="sign-up" className="c-auth__sign-in" title="Sign In">
            <>
				<form onSubmit={handleSubmit(onSubmit)} className="c-auth__form">
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
					<button className="btn btn--primary t-uppercase">submit</button>
				</form>
				<div className="c-auth__info">
					<p className="t-b-1">Do not have an account?</p>
					<button
						type="button"
						className="c-auth__info-cta t-uppercase cr-surface-sage"
						onClick={() => onSetPageStatus(STATUS_SIGN_UP)}
					>
						Sign Up
					</button>
				</div>
				<div className="c-auth__help">
					<p className="t-b-2">
						Need help?{' '}
						<NextLink href="/contact" className="cr-surface-sage">
							Contact support
						</NextLink>
					</p>
				</div>
			</>
        </AuthContainer>)
    );
};

export default SignIn;
