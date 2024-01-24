'use client';
import cx from 'classnames';
import NextLink from 'next/link';
import React, { useState } from 'react';

import SignIn from '@/app/_components/auth/SignIn';
import SignUp from '@/app/_components/auth/SignUp';

type AuthType = {
	className?: string;
};

export const STATUS_SIGN_UP = 'signUp';
export const STATUS_SIGN_IN = 'signIn';

const Auth: React.FC<AuthType> = ({ className }) => {
	const [pageStatus, setPageStatus] = useState(STATUS_SIGN_UP);

	const onSetPageStatus = (value: string) => {
		setPageStatus(value);
	};

	const pageStatusScreen = {
		signUp: <SignUp onSetPageStatus={onSetPageStatus} />,
		signIn: <SignIn onSetPageStatus={onSetPageStatus} />,
	};

	return (
		<>
			<div className={cx('c-sign-in f-v f-j-c', className)}>
				{pageStatusScreen[pageStatus]}
			</div>
		</>
	);
};

export default Auth;
