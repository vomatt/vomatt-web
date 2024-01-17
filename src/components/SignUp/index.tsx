'use client';
import cx from 'classnames';
import NextLink from 'next/link';
import React, { useState } from 'react';

import CustomLink from '@/components/CustomLink';
import Field from '@/components/Field';

type SignUpType = {
	className?: string;
};

const SignUp: React.FC<SignUpType> = ({ className }) => {
	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log('🚀 ~ onSubmit ~ e:', e);
	};

	return (
		<>
			<div className={cx('c-sign-up f-v f-j-c', className)}>
				<h1 className="c-sign-up__heading t-h-1">sign up</h1>
				<form onSubmit={onSubmit} className="c-sign-up__form">
					<Field
						label="Email address"
						name="email"
						required={true}
						isFloatingLabel={true}
					/>
					<button className="btn">submit</button>
				</form>
				<p className="c-sign-up__info">
					Need help?{' '}
					<NextLink href="/contact" className="cr-surface-sage">
						Contact support
					</NextLink>
				</p>
			</div>
		</>
	);
};

export default SignUp;
