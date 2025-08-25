'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import AuthContainer from '@/components/auth/AuthContainer';
import VerificationForm from '@/components/auth/VerificationForm';
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
import { Button } from '@/components/ui/Button';
import { STATUS_LOG_IN, STATUS_VERIFICATION } from '@/data/constants';

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

type currentStepType = 'STATUS_LOG_IN' | 'STATUS_VERIFICATION';

export default function SignUp({ signUpInfoData }: SignUpType) {
	const [currentStep, setCurrentStep] =
		useState<currentStepType>(STATUS_LOG_IN);
	const [email, setEmail] = useState('');

	const onSetCurrentStep = (value: currentStepType) => {
		setCurrentStep(value);
	};

	const onSetEmail = (value: string) => {
		setEmail(value);
	};

	const currentStepScreen = {
		STATUS_LOG_IN: (
			<SignUpForm
				onSetCurrentStep={onSetCurrentStep}
				onSetEmail={onSetEmail}
				signUpInfoData={signUpInfoData}
			/>
		),
		STATUS_VERIFICATION: (
			<VerificationForm
				email={email}
				backButtonFunc={() => onSetCurrentStep(STATUS_LOG_IN)}
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
	onSetEmail: (value: string) => void;
};

function SignUpForm({
	onSetCurrentStep,
	signUpInfoData,
	onSetEmail,
}: SignUpFormType) {
	const { policyMessage } = signUpInfoData || {};
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

			if (resData.status === 'ERROR') {
				setError(resData.message);
				return;
			}

			onSetEmail(data.email);
			onSetCurrentStep(STATUS_VERIFICATION);
		} catch (error) {
			setError('Something went wrong, pleas try again later');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex justify-center items-center">
			<div className="max-w-96 w-full">
				<h1 className="text-3xl mb-10 text-center">Create your account</h1>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email Address</FormLabel>
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
									<FormLabel>First Name</FormLabel>
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
									<FormLabel>Last Name</FormLabel>
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
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input type="text" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button className="w-full" type="submit" disabled={isLoading}>
							Submit
						</Button>
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
			</div>
		</div>
	);
}
