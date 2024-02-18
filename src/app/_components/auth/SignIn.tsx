'use client';
import cx from 'classnames';
import NextLink from 'next/link';
import { useState } from 'react';

import Field from '@/components/Field';
import { validateEmail } from '@/lib/helpers';

import AuthContainer from './AuthContainer';
import { STATUS_SIGN_UP } from './index';

type SignInType = {
	onSetPageStatus: (value: string) => void;
	className?: string;
};

const SignIn: React.FC<SignInType> = ({ className, onSetPageStatus }) => {
	const [errors, setErrors] = useState(null);

	const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const email = event.target[0].value;
		const isValidEmail = validateEmail(email);
		if (!isValidEmail) {
			setErrors({ email: 'Please enter a valid email.' });
			return;
		}

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				body: JSON.stringify(email),
			});
			const data = res.json();
		} catch (error) {
			console.log('🚀 ~ file: SignIn.tsx:36 ~ onSubmit ~ error:', error);
		}
	};

	return (
		<AuthContainer type="sign-up" className="c-auth__sign-in" title="Sign In">
			<>
				<form onSubmit={onSubmit} className="c-auth__form">
					<Field
						label="Email address"
						type="email"
						name="email"
						required={true}
						isFloatingLabel={true}
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
		</AuthContainer>
	);
};

export default SignIn;
