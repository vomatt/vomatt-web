'use client';

import React, { useState } from 'react';
import AuthContainer from '@/components/auth/AuthContainer';
import SignIn from '@/components/auth/SignIn';
import VerificationForm from '@/components/auth/VerificationForm';

type AuthType = {
	className?: string;
};

export const STATUS_SIGN_IN = 'STATUS_SIGN_IN';
export const VERIFICATION = 'VERIFICATION';

const Auth: React.FC<AuthType> = ({ className }) => {
	const [pageStatus, setPageStatus] = useState(STATUS_SIGN_IN);

	const onSetPageStatus = (value: string) => {
		setPageStatus(value);
	};

	const pageStatusScreen = {
		STATUS_SIGN_IN: <SignIn onSetPageStatus={onSetPageStatus} />,
		VERIFICATION: <VerificationForm email="chinklaus@gmail.com" />,
	};

	return (
		<AuthContainer
			type={pageStatus}
			title={pageStatus ? 'Sign In' : 'Code Verification'}
		>
			{pageStatusScreen[pageStatus]}
		</AuthContainer>
	);
};

export default Auth;
