'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import AuthContainer from '@/components/auth/AuthContainer';
import VerificationForm from '@/components/auth/VerificationForm';
import { ButtonLoading } from '@/components/ButtonLoading';
import CustomPortableText from '@/components/CustomPortableText';
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
import { STATUS_SIGN_UP, STATUS_VERIFICATION } from '@/data/constants';

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

type currentStepType = 'STATUS_SIGN_UP' | 'STATUS_VERIFICATION';

export const defaultValues = {
	email: '',
	firstName: '',
	lastName: '',
	username: '',
};

export default function SignUp({ signUpInfoData }: SignUpType) {
	const [currentStep, setCurrentStep] =
		useState<currentStepType>(STATUS_SIGN_UP);

	const [formData, setFormData] = useState(defaultValues);

	const onSetCurrentStep = (value: currentStepType) => {
		setCurrentStep(value);
	};

	const onSetFormData = (value: typeof defaultValues) => {
		setFormData(value);
	};

	const onSubmitSignUp = async (pin: string) => {
		const bodyData = {
			...formData,
			verificationCode: pin,
		};

		try {
			const res = await fetch('/api/auth/signup', {
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
				message: apiMessage || 'Verification failed',
			};
		} catch (error) {
			return {
				status: 'ERROR' as const,
				message: 'Something went wrong, pleas try again later',
			};
		}
	};

	const currentStepScreen = {
		STATUS_SIGN_UP: (
			<SignUpForm
				onSetCurrentStep={onSetCurrentStep}
				onSetFormData={onSetFormData}
				signUpInfoData={signUpInfoData}
			/>
		),
		STATUS_VERIFICATION: (
			<VerificationForm
				email={formData.email}
				backButtonFunc={() => onSetCurrentStep(STATUS_SIGN_UP)}
				submitCodeFunc={onSubmitSignUp}
			/>
		),
	};

	return (
		<AuthContainer type={currentStep}>
			{currentStepScreen[currentStep]}
		</AuthContainer>
	);
}

type SignUpFormType = {
	signUpInfoData: any;
	onSetCurrentStep: (value: currentStepType) => void;
	onSetFormData: (value: typeof defaultValues) => void;
};

function SignUpForm({
	onSetCurrentStep,
	signUpInfoData,
	onSetFormData,
}: SignUpFormType) {
	const { t } = useLanguage();
	const { policyMessage } = signUpInfoData || {};
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues,
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		setIsLoading(true);
		setError('');
		try {
			const response = await fetch('/api/auth/pre-signup', {
				method: 'POST',
				body: JSON.stringify(data),
			});

			const resData = await response.json();

			if (resData.status === 'ERROR') {
				setError(resData.message);
				return;
			}

			onSetFormData(data);
			onSetCurrentStep(STATUS_VERIFICATION);
		} catch (error) {
			setError('Something went wrong, pleas try again later');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<h1 className="text-3xl mb-10 text-center">{t('signup.title')}</h1>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('common.email')}</FormLabel>
								<FormControl>
									<Input type="text" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="firstName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('common.firstName')}</FormLabel>
								<FormControl>
									<Input type="text" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="lastName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('common.lastName')}</FormLabel>
								<FormControl>
									<Input type="text" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="username"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('common.username')}</FormLabel>
								<FormControl>
									<Input type="text" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<ButtonLoading className="w-full" type="submit" isLoading={isLoading}>
						{t('signup.submit')}
					</ButtonLoading>

					{error && <p className="t-l-1 text-destructive mt-3">{error}</p>}
				</form>
			</Form>
			{policyMessage && (
				<div className="mt-10 text-sm">
					<CustomPortableText blocks={policyMessage} />
				</div>
			)}
			<hr className="w-full h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
			<div className="flex justify-center">
				<NextLink href="/login" className="cr-gray-900 underline">
					Already have a account?
				</NextLink>
			</div>
		</>
	);
}
