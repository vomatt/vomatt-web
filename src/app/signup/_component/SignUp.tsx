'use client';
import { motion } from 'framer-motion';
import NextLink from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import Button from '@/components/Button';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { useForm } from 'react-hook-form';
import CustomPortableText from '@/components/CustomPortableText';

import { z } from 'zod';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
	FormLabel,
} from '@/components/Form';
import AuthContainer from '@/components/auth/AuthContainer';
import { STATUS_SIGN_IN, STATUS_VERIFICATION } from '@/data/constants';
import VerificationForm from '@/components/auth/VerificationForm';

const nameValidation = new RegExp(
	/^[\w'\-,.]*[^_!¡?÷?¿\/\\+=@#$%ˆ&*(){}|~<>;:[\]]*$/
);
const FormSchema = z.object({
	email: z
		.string()
		.email({
			message: 'Invalid email address',
		})
		.trim(),
	firstName: z
		.string()
		.min(1, { message: 'First Name is Required' })
		.regex(nameValidation, { message: 'Invalid name' }),
	lastName: z
		.string()
		.min(1, { message: 'Last Name is Required' })
		.regex(nameValidation, { message: 'Invalid name' }),
	username: z
		.string()
		.min(3, { message: 'Username is Required' })
		.regex(new RegExp(/^[a-z][-a-z0-9_]*\$?$/), {
			message: 'Invalid Username',
		}),
});

type SignUpType = {
	className?: string;
	signUpInfoData: any;
};
type PageStatusType = 'STATUS_SIGN_IN' | 'STATUS_VERIFICATION';

export default function SignUp({ className, signUpInfoData }: SignUpType) {
	const [pageStatus, setPageStatus] = useState<PageStatusType>(STATUS_SIGN_IN);
	const [email, setEmail] = useState('');

	const onSetPageStatus = (value: PageStatusType) => {
		setPageStatus(value);
	};

	const onSetEmail = (value: string) => {
		setEmail(value);
	};

	const pageStatusScreen = {
		STATUS_SIGN_IN: (
			<SignUpForm
				onSetPageStatus={onSetPageStatus}
				onSetEmail={onSetEmail}
				signUpInfoData={signUpInfoData}
			/>
		),
		STATUS_VERIFICATION: (
			<VerificationForm
				email={email}
				backButtonFunc={() => onSetPageStatus(STATUS_SIGN_IN)}
			/>
		),
	};

	return (
		<AuthContainer type={pageStatus}>
			{pageStatusScreen[pageStatus]}
		</AuthContainer>
	);
}

type SignUpFormType = {
	signUpInfoData: any;
	onSetPageStatus: (value: PageStatusType) => void;
	onSetEmail: (value: string) => void;
};

function SignUpForm({
	onSetPageStatus,
	signUpInfoData,
	onSetEmail,
}: SignUpFormType) {
	const { policyMessage } = signUpInfoData;
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			email: '',
			firstName: '',
			lastName: '',
			username: '',
		},
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		setIsLoading(true);

		try {
			const response = await fetch('/api/sign-up', {
				method: 'POST',
				body: JSON.stringify(data),
			});

			const resData = await response.json();
			console.log('🚀 ~ file: SignUp.tsx:111 ~ onSubmit ~ resData:', resData);

			if (resData.status === 'ERROR') {
				setError(resData.message);
				return;
			}

			onSetEmail(data.email);
			onSetPageStatus(STATUS_VERIFICATION);
		} catch (error) {
			setError('Something went wrong, pleas try again later');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex justify-center items-center">
			<div className="max-w-96 w-full">
				<h1 className="t-h-2 mb-10 text-white text-center">Sign up</h1>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="mb-10">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem className="mb-5">
									<FormControl>
										<FloatingLabelInput
											type="text"
											label="Email Address"
											id="signInEmail"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="firstName"
							render={({ field }) => (
								<FormItem className="mb-5">
									<FormControl>
										<FloatingLabelInput
											type="text"
											label="First Name"
											id="signUpFirstName"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="lastName"
							render={({ field }) => (
								<FormItem className="mb-5">
									<FormControl>
										<FloatingLabelInput
											type="text"
											label="Last Name"
											id="signUpLastName"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem className="mb-5">
									<FormControl>
										<FloatingLabelInput
											type="text"
											label="Username"
											id="signUpUsername"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button className="w-full" type="submit" isLoading={isLoading}>
							Submit
						</Button>
						{error && <p className="t-l-1 text-error mt-3">{error}</p>}
					</form>
				</Form>
				<CustomPortableText blocks={policyMessage} />
			</div>
		</div>
	);
}
