'use client';
import React, { useState } from 'react';
import AuthContainer from '@/components/auth/AuthContainer';
import VerificationForm from '@/components/auth/VerificationForm';
import Button from '@/components/Button';
import NextLink from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { getVerifyCode } from '@/app/api/login/getVerifyCode';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';

import { Input } from '@/components/Input';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { STATUS_VERIFICATION, STATUS_SIGN_IN } from './AuthContainer';

export default function SignIn() {
	const [pageStatus, setPageStatus] = useState(STATUS_SIGN_IN);
	const [email, setEmail] = useState('');

	const onSetPageStatus = (value: string) => {
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
			<VerificationForm email={email} onSetPageStatus={onSetPageStatus} />
		),
	};

	return (
		<AuthContainer
			type={pageStatus}
			title={pageStatus === STATUS_SIGN_IN ? 'Sign in' : 'We sent you code'}
		>
			{pageStatusScreen[pageStatus]}
		</AuthContainer>
	);
}

type SignInType = {
	onSetPageStatus: (value: string) => void;
	onSetEmail: (value: string) => void;
	className?: string;
};

const FormSchema = z.object({
	email: z.string().email({
		message: 'Invalid email address',
	}),
});

function SignInForm({ onSetPageStatus, onSetEmail }: SignInType) {
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
			console.log('🚀 ~ file: SignIn.tsx:85 ~ onSubmit ~ res:', res);
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
		<>
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
					<Button
						size="xg"
						className="w-full"
						type="submit"
						isLoading={isLoading}
					>
						Submit
					</Button>
					{error && <p className="t-l-1 text-error mt-3">{error}</p>}
				</form>
			</Form>
			<p className="t-b-2 text-center">
				Need help?{' '}
				<NextLink href="/contact" className="cr-grey-900 underline">
					Forgot password
				</NextLink>
			</p>
			<div className="mb-6 text-center">
				<div className="inline-flex items-center justify-center w-full">
					<hr className="w-64 h-px my-8 bg-grey-200 border-0 dark:bg-grey-700" />
					<span className="absolute px-2 font-medium -translate-x-1/2 text-white left-1/2 bg-black t-b-1">
						or
					</span>
				</div>
				<p className="t-b-2 text-center">
					Don&apos;t have an account?{' '}
					<NextLink href="/signup" className="cr-grey-900 underline">
						Sign up
					</NextLink>
				</p>
			</div>
		</>
	);
}
