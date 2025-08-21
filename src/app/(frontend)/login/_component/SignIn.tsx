'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { getVerifyCode } from '@/app/api/login/getVerifyCode';
import AuthContainer from '@/components/auth/AuthContainer';
import VerificationForm from '@/components/auth/VerificationForm';
import { Button } from '@/components/Button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { STATUS_SIGN_IN, STATUS_VERIFICATION } from '@/data/constants';

type PageStatusType = 'STATUS_SIGN_IN' | 'STATUS_VERIFICATION';

export default function SignIn() {
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
			<SignInForm onSetPageStatus={onSetPageStatus} onSetEmail={onSetEmail} />
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

type SignInFormType = {
	onSetPageStatus: (value: PageStatusType) => void;
	onSetEmail: (value: string) => void;
	className?: string;
};

const FormSchema = z.object({
	email: z.string().email({
		message: 'Invalid email address',
	}),
});

function SignInForm({ onSetPageStatus, onSetEmail }: SignInFormType) {
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			email: '',
		},
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		const { email } = data;
		setIsLoading(true);

		try {
			const res = await getVerifyCode(email);
			if (res.status === 'success') {
				onSetEmail(email);
				onSetPageStatus(STATUS_VERIFICATION);
				return;
			}
		} catch (error) {
			console.error('file:36 ~ onSubmit ~ error:', error);
			setError('Something went wrong, pleas try again later');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="">
			<h1 className="font-medium text-6xl text-center mb-10">Sign in</h1>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="mb-10">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => {
							return (
								<FormItem className="mb-5">
									<FormLabel>Email Address</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="m@example.com"
											required
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<Button className="w-full" type="submit" disabled={isLoading}>
						Login
					</Button>
					{error && <p className="t-l-1 text-error mt-3">{error}</p>}
				</form>
			</Form>
			<p className="t-b-1 text-center">
				Need help?{' '}
				<NextLink href="/forgot-password" className="cr-gray-900 underline">
					Forgot password
				</NextLink>
			</p>
			<div className="mb-6 text-center">
				<div className="inline-flex items-center justify-center w-full">
					<hr className="w-64 h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
					<span className="absolute px-2 font-medium -translate-x-1/2 text-white left-1/2 bg-background t-b-1">
						or
					</span>
				</div>
				<p className="t-b-1 text-center">
					Don&apos;t have an account?{' '}
					<NextLink href="/signup" className="cr-gray-900 underline">
						Sign up
					</NextLink>
				</p>
			</div>
		</div>
	);
}
