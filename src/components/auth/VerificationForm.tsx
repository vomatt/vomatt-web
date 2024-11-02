import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { STATUS_SIGN_IN } from './AuthContainer';
import Button from '@/components/Button';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/auth/InputOTP';

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from '@/components/Form';

interface VerificationFormProps {
	email: string;
	onSetPageStatus: (value: PageStatusType) => void;
}

const FormSchema = z.object({
	pin: z.string().min(6, {
		message: 'Your one-time password must be 6 characters.',
	}),
});

export default function VerificationForm({
	email,
	onSetPageStatus,
}: VerificationFormProps) {
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			pin: '',
		},
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		const { pin } = data;
		try {
			setError('');
			setIsLoading(true);
			const res = await fetch('/api/login/verify-code', {
				method: 'POST',
				body: JSON.stringify({ email, verifyCode: pin }),
			});
			const data = await res.json();
			console.log(
				'🚀 ~ file: VerificationForm.tsx:56 ~ onSubmit ~ data:',
				data
			);

			if (data.status === 'SUCCESS') {
			} else {
				setError('Wrong code');
			}
		} catch (e) {
			setError('Something went wrong, pleas try again later');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<h1 className="t-h-3 text-center mb-6">We sent you a code</h1>
			<h5 className="t-b-1 mb-8 text-center">
				Enter it below to verify {email}
			</h5>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="mb-8">
					<FormField
						control={form.control}
						name="pin"
						render={({ field }) => (
							<FormItem className="space-y-3 mb-3">
								<FormControl>
									<InputOTP
										maxLength={6}
										autoFocus
										{...field}
										containerClassName="justify-center"
									>
										<InputOTPGroup className="w-full">
											<InputOTPSlot index={0} className="h-16" />
											<InputOTPSlot index={1} className="h-16" />
											<InputOTPSlot index={2} className="h-16" />
											<InputOTPSlot index={3} className="h-16" />
											<InputOTPSlot index={4} className="h-16" />
											<InputOTPSlot index={5} className="h-16" />
										</InputOTPGroup>
									</InputOTP>
								</FormControl>
								{error && (
									<FormMessage className="text-center text-error">
										{error}
									</FormMessage>
								)}
							</FormItem>
						)}
					/>
					<Button
						type="submit"
						className="w-full mt-8 block"
						size="xg"
						isLoading={isLoading}
					>
						Submit
					</Button>
					<Button
						className="w-full mt-6 mx-auto block"
						onClick={() => onSetPageStatus(STATUS_SIGN_IN)}
						variant="outline"
						size="lg"
					>
						Back
					</Button>
				</form>
			</Form>
			<Button className="underline mx-auto block" variant="link">
				Didn&apos;t receive email?
			</Button>
		</>
	);
}
