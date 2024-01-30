'use client';
import cx from 'classnames';
import NextLink from 'next/link';

import Field from '@/components/Field';

import AuthContainer from './AuthContainer';
import { STATUS_SIGN_UP } from './index';

type SignInType = {
	onSetPageStatus: (value: string) => void;
	className?: string;
};

const SignIn: React.FC<SignInType> = ({ className, onSetPageStatus }) => {
	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log('🚀 ~ onSubmit ~ e:', e);
	};

	return (
		<AuthContainer type="sign-up" className="c-auth__sign-in" title="Sign In">
			<>
				<form onSubmit={onSubmit} className="c-auth__form">
					<Field
						label="Email address"
						name="email"
						required={true}
						isFloatingLabel={true}
					/>
					<button className="btn t-uppercase">submit</button>
				</form>
				<div className="c-auth__info">
					<p className="t-b-1">Do not have an account?</p>
					<button
						type="button"
						className="cr-surface-sage c-auth__info-cta"
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
