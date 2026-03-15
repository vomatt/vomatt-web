'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type {
	ControllerFieldState,
	ControllerRenderProps,
} from 'react-hook-form';
import { z } from 'zod';

import AuthContainer from '@/components/auth/AuthContainer';
import VerificationForm from '@/components/auth/VerificationForm';
import { ButtonLoading } from '@/components/ButtonLoading';
import { RichText } from '@payloadcms/richtext-lexical/react';
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldContent,
	FieldStatus,
} from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { STATUS_SIGN_UP, STATUS_VERIFICATION } from '@/data/constants';
import { preSignup, signup } from '@/lib/api/endpoints/auth';
import { useSessionStorage } from '@/hooks/useSessionStorage';

const nameValidation = new RegExp(
	/^[\w'\-,.]*[^_!¡?÷?¿\/\\+=@#$%ˆ&*(){}|~<>;:[\]]*$/
);

const formSchema = z.object({
	email: z
		.string()
		.email({
			message: 'common.invalidEmailAddress',
		})
		.trim(),
	firstName: z
		.string()
		.min(1, { message: 'common.required' })
		.regex(nameValidation, { message: 'common.invalidName' }),
	lastName: z
		.string()
		.min(1, { message: 'common.required' })
		.regex(nameValidation, { message: 'common.invalidName' }),
	username: z
		.string()
		.min(3, { message: 'common.required' })
		.regex(new RegExp(/^[a-zA-Z0-9._]+$/), {
			message: 'common.invalidUsername',
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

	const onSubmitSignUp = async (pin: string) => {
		try {
			const result = await signup({ ...formData, verificationCode: pin });
			if (result.status === 'SUCCESS') return { status: 'OK' as const };
			return {
				status: 'ERROR' as const,
				message: result.message || 'Verification failed',
			};
		} catch {
			return {
				status: 'ERROR' as const,
				message: 'Something went wrong, please try again later',
			};
		}
	};

	const currentStepScreen = {
		STATUS_SIGN_UP: (
			<SignUpForm
				onSetCurrentStep={onSetCurrentStep}
				onSetFormData={setFormData}
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
	const [value] = useSessionStorage('login-email', '');

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
			const resData = await preSignup(data.email, data.username);

			if (resData.status === 'ERROR') {
				setError(resData.message ?? '');
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
						render={({ field, fieldState }) => (
							<FormTextField
								field={field}
								fieldState={fieldState}
								id="signUpEmail"
								label={t('common.email')}
							/>
						)}
					/>
					<Controller
						name="firstName"
						control={form.control}
						render={({ field, fieldState }) => (
							<FormTextField
								field={field}
								fieldState={fieldState}
								id="signUpFirstName"
								label={t('common.firstName')}
								autoComplete="off"
							/>
						)}
					/>
					<Controller
						name="lastName"
						control={form.control}
						render={({ field, fieldState }) => (
							<FormTextField
								field={field}
								fieldState={fieldState}
								id="signUpLastName"
								label={t('common.lastName')}
								autoComplete="off"
							/>
						)}
					/>
					<Controller
						control={form.control}
						name="username"
						render={({ field, fieldState }) => (
							<FormTextField
								field={field}
								fieldState={fieldState}
								id="signUpUsername"
								label={t('common.username')}
								autoComplete="off"
							/>
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
					<RichText data={policyMessage} />
				</div>
			)}
			<hr className="w-full h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
			<div className="flex justify-center">
				<NextLink href="/login" className="cr-gray-900 underline">
					{t('signup.alreadyHaveAccount')}
				</NextLink>
			</div>
		</>
	);
}

function FormTextField({
	field,
	fieldState,
	id,
	label,
	autoComplete,
}: {
	field: ControllerRenderProps<z.infer<typeof formSchema>>;
	fieldState: ControllerFieldState;
	id: string;
	label: string;
	autoComplete?: string;
}) {
	const [isFocused, setIsFocused] = useState(false);
	return (
		<Field data-invalid={fieldState.invalid}>
			<FieldContent>
				<FieldLabel htmlFor={id}>{label}</FieldLabel>
				<Input
					{...field}
					type="text"
					id={id}
					aria-invalid={fieldState.invalid}
					autoComplete={autoComplete}
					onFocus={() => setIsFocused(true)}
					onBlur={() => {
						field.onBlur();
						setIsFocused(false);
					}}
				/>
				<FieldStatus
					fieldState={fieldState}
					isFocused={isFocused}
					isShowErrorOnFocus={true}
				/>
			</FieldContent>
		</Field>
	);
}
