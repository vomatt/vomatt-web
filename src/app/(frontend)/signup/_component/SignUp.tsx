'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import AuthContainer from '@/components/auth/AuthContainer';
import VerificationForm from '@/components/auth/VerificationForm';
import { ButtonLoading } from '@/components/ButtonLoading';
import CustomPortableText from '@/components/CustomPortableText';
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { STATUS_SIGN_UP, STATUS_VERIFICATION } from '@/data/constants';
import { useSessionStorage } from '@/hooks/useSessionStorage';

const nameValidation = new RegExp(
	/^[\w'\-,.]*[^_!¡?÷?¿\/\\+=@#$%ˆ&*(){}|~<>;:[\]]*$/
);

const formSchema = z.object({
	email: z
		.string()
		.email({
			message: 'invalidEmailAddress',
		})
		.trim(),
	firstName: z
		.string()
		.min(1, { message: 'common.required' })
		.regex(nameValidation, { message: 'signup.invalidName' }),
	lastName: z
		.string()
		.min(1, { message: 'common.required' })
		.regex(nameValidation, { message: 'signup.invalidName' }),
	username: z
		.string()
		.min(3, { message: 'common.required' })
		.regex(new RegExp(/^[a-z][-a-z0-9_]*\$?$/), {
			message: 'signup.invalidName',
		}),
});

type SignUpType = {
	className?: string;
	signUpInfoData: any;
};

type currentStepType = 'STATUS_SIGN_UP' | 'STATUS_VERIFICATION';
const defaultValues = {
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
			console.log('🚀 ~ :89 ~ onSubmitSignUp ~ data:', data);
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
	const [value, setValue, removeValue] = useSessionStorage('login-email', '');

	const { policyMessage } = signUpInfoData || {};
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { ...defaultValues, email: value },
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		setIsLoading(true);
		setError('');
		try {
			const response = await fetch('/api/auth/pre-signup', {
				method: 'POST',
				body: JSON.stringify(data),
			});

			const resData = await response.json();
			console.log('🚀 ~ :165 ~ onSubmit ~ resData:', resData);

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
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FieldGroup>
					<Controller
						name="email"
						control={form.control}
						render={({ field, fieldState }) => {
							return (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="signUpEmail">
										{t('common.email')}
									</FieldLabel>
									<Input
										{...field}
										type="text"
										id="signUpEmail"
										aria-invalid={fieldState.invalid}
									/>

									{fieldState.invalid && (
										<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
									)}
								</Field>
							);
						}}
					/>
					<Controller
						name="firstName"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor="signUpFirstName">
									{t('common.firstName')}
								</FieldLabel>
								<Input
									{...field}
									type="text"
									id="signUpFirstName"
									aria-invalid={fieldState.invalid}
									autoComplete="off"
								/>
								{fieldState.invalid && (
									<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
								)}
							</Field>
						)}
					/>
					<Controller
						name="lastName"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor="signUpLastName">
									{t('common.lastName')}
								</FieldLabel>
								<Input
									{...field}
									type="text"
									id="signUpLastName"
									aria-invalid={fieldState.invalid}
									autoComplete="off"
								/>
								{fieldState.invalid && (
									<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
								)}
							</Field>
						)}
					/>
					<Controller
						control={form.control}
						name="username"
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor="signUpUsername">
									{t('common.username')}
								</FieldLabel>
								<Input
									{...field}
									type="text"
									id="signUpUsername"
									aria-invalid={fieldState.invalid}
									autoComplete="off"
								/>
								{fieldState.invalid && (
									<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
								)}
							</Field>
						)}
					/>
				</FieldGroup>
				<ButtonLoading className="w-full" type="submit" isLoading={isLoading}>
					{t('signup.submit')}
				</ButtonLoading>
			</form>
			{error && <p className="t-l-1 text-destructive mt-3">{error}</p>}

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
