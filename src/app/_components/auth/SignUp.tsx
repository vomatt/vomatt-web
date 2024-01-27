'use client';
import cx from 'classnames';
import NextLink from 'next/link';
import React, { useState } from 'react';

import CMSLink from '@/components/CMSLink';
import Field from '@/components/Field';

import AuthContainer from './AuthContainer';
import { STATUS_SIGN_IN } from './index';

type SignUpType = {
	onSetPageStatus: (value: string) => void;
	className?: string;
};

const SignUp: React.FC<SignUpType> = ({ className, onSetPageStatus }) => {
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
				<form onSubmit={onSubmit} className="c-auth__form">
					<Field
						label="Email address"
						name="email"
						required={true}
						isFloatingLabel={true}
					/>
					<button className="btn t-uppercase">enter</button>
				</form>
				<div className="c-auth__info">
					<p>Already have an account?</p>
					<button
						type="button"
						className="cr-surface-sage c-auth__info-cta"
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
