'use client';
import cx from 'classnames';
import NextLink from 'next/link';
import React, { useState } from 'react';

import CustomLink from '@/components/CustomLink';
import Field from '@/components/Field';

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
		<>
			<div className={cx('c-auth f-v f-j-c', className)}>
				<h1 className="c-auth__heading t-h-1">Sign In</h1>
				<div className="c-auth__content f-v f-j-c">
					<form onSubmit={onSubmit} className="c-auth__form">
						<Field
							label="Email address"
							name="email"
							required={true}
							isFloatingLabel={true}
						/>
						<button className="btn">submit</button>
					</form>
					<div className="c-auth__info">
						<p>Already have an account?</p>
						<button
							type="button"
							className="cr-surface-sage c-auth__info-cta"
							onClick={() => onSetPageStatus(STATUS_SIGN_UP)}
						>
							Sign Up
						</button>
					</div>
					<div className="c-auth__help">
						<p>
							Need help?{' '}
							<NextLink href="/contact" className="cr-surface-sage">
								Contact support
							</NextLink>
						</p>
					</div>
				</div>
			</div>
		</>
	);
};

export default SignIn;
