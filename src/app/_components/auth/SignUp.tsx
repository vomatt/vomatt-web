'use client';
import cx from 'classnames';
import NextLink from 'next/link';
import React, { useState } from 'react';

import CustomLink from '@/components/CustomLink';
import Field from '@/components/Field';

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
		<>
			<div className={cx('c-auth f-v f-j-c', className)}>
				<h1 className="c-auth__heading t-h-1">create your account</h1>
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
							onClick={() => onSetPageStatus(STATUS_SIGN_IN)}
						>
							Sign In
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default SignUp;
