'use client';
import { motion } from 'framer-motion';
import NextLink from 'next/link';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

interface SignUpProps {
	className?: string;
	signUpInfoData: any;
}

type FormValues = {
	email: string;
};

const SignUp: React.FC<SignUpProps> = ({ className, signUpInfoData }) => {
	const { policyMessage } = signUpInfoData || {};
	const [error, setError] = useState(false);
	const {
		handleSubmit,
		register,
		watch,
		reset,
		formState: { errors },
	} = useForm();

	const onSubmit: SubmitHandler<FormValues> = async (data) => {
		const { email } = data;
	};

	return (
		<div>
			<h1>Sign up</h1>
		</div>
	);
};

export default SignUp;
