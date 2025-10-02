'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { getVerifyCode } from '@/app/api/auth/login/getVerifyCode';
import AuthContainer from '@/components/auth/AuthContainer';
import VerificationForm from '@/components/auth/VerificationForm';
import { ButtonLoading } from '@/components/ButtonLoading';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { STATUS_LOG_IN, STATUS_VERIFICATION } from '@/data/constants';

type PageStatusType = 'STATUS_LOG_IN' | 'STATUS_VERIFICATION';

export function LogIn() {
	const [pageStatus, setPageStatus] = useState<PageStatusType>(STATUS_LOG_IN);
	const [email, setEmail] = useState('');
	const onSetPageStatus = (value: PageStatusType) => {
		setPageStatus(value);
	};

	const onSetEmail = (value: string) => {
		setEmail(value);
	};

	const onSubmitLogin = async (pin: string) => {
		const bodyData = {
			email,
			verificationCode: pin,
		};

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				body: JSON.stringify(bodyData),
			});
			const data = await res.json();
			const apiStatus = data?.status;
			const apiMessage = data?.message as string | undefined;

			if (apiStatus === 'SUCCESS') {
				return { status: 'OK' as const };
			}

			return {
				status: 'ERROR' as const,
				message: apiMessage || 'Login failed',
			};
		} catch (error) {
			return {
				status: 'ERROR' as const,
				message: 'Something went wrong, pleas try again later',
			};
		}
	};

	const pageStatusScreen = {
		STATUS_LOG_IN: (
			<LogInForm onSetPageStatus={onSetPageStatus} onSetEmail={onSetEmail} />
		),
		STATUS_VERIFICATION: (
			<VerificationForm
				email={email}
				backButtonFunc={() => onSetPageStatus(STATUS_LOG_IN)}
				submitCodeFunc={onSubmitLogin}
			/>
		),
	};

	return (
		<AuthContainer type={pageStatus}>
			{pageStatusScreen[pageStatus]}
		</AuthContainer>
	);
}

type LogInFormType = {
	onSetPageStatus: (value: PageStatusType) => void;
	onSetEmail: (value: string) => void;
	className?: string;
};

const FormSchema = z.object({
	email: z.string().email({
		message: 'Invalid email address',
	}),
});

function LogInForm({ onSetPageStatus, onSetEmail }: LogInFormType) {
	const { t } = useLanguage();
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

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
			if (res.status === 'SUCCESS') {
				onSetEmail(email);
				onSetPageStatus(STATUS_VERIFICATION);
				return;
			}

			if (res.message === 'USER_NOT_FOUND') {
				return router.push('/signup');
			}
			setError(res.message);
		} catch (error) {
			setError('Something went wrong, pleas try again later');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<h1 className="font-medium text-3xl text-center mb-10">
				{t('login.title')}
			</h1>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => {
							return (
								<FormItem className="mb-5">
									<FormLabel>{t('common.email')}</FormLabel>
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
					<ButtonLoading className="w-full" type="submit" isLoading={isLoading}>
						{t('common.login')}
					</ButtonLoading>
					{error && (
						<p className="text-destructive text-center mt-3">
							{t(`login.${error}`)}
						</p>
					)}
				</form>
			</Form>
			<p className="mt-5 text-center">
				Don&apos;t have an account?{' '}
				<NextLink
					href="/signup"
					className="cr-gray-900 underline underline-offset-4"
				>
					Sign up
				</NextLink>
			</p>
		</>
	);
}
