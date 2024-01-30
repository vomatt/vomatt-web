'use client';

import React, { useState } from 'react';

import SignIn from '@/app/_components/auth/SignIn';
import SignUp from '@/app/_components/auth/SignUp';
import VerificationForm from '@/app/_components/auth/VerificationForm';

type AuthType = {
	className?: string;
};

export const STATUS_SIGN_UP = 'signUp';
export const STATUS_SIGN_IN = 'signIn';
export const VERIFICATION = 'verification';

const Auth: React.FC<AuthType> = ({ className }) => {
	const [pageStatus, setPageStatus] = useState(STATUS_SIGN_IN);

	const onSetPageStatus = (value: string) => {
		setPageStatus(value);
	};

	const pageStatusScreen = {
		signUp: <SignUp onSetPageStatus={onSetPageStatus} />,
		signIn: <SignIn onSetPageStatus={onSetPageStatus} />,
		verification: <VerificationForm email="chinklaus@gmail.com" />,
	};

	return pageStatusScreen[pageStatus];
};

export default Auth;
