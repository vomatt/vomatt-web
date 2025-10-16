import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { ButtonLoading } from '@/components/ButtonLoading';
import { MailCheckIcon } from '@/components/ui/animate-icon/MailCheck';
import { Button } from '@/components/ui/Button';
import { Field, FieldError } from '@/components/ui/Field';
import { useLanguage } from '@/contexts/LanguageContext';

import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from './InputOTP';

interface VerificationFormProps {
	email: string;
	submitCodeFunc: (
		pin: string
	) => Promise<{ status: 'ERROR' | 'OK'; message?: string }>;
	backButtonFunc: () => void;
}

const FormSchema = z.object({
	pin: z.string().min(6, {
		message: 'Your one-time password must be 6 characters.',
	}),
});

export default function VerificationForm({
	email,
	submitCodeFunc,
	backButtonFunc,
}: VerificationFormProps) {
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			pin: '',
		},
	});
	const { t } = useLanguage();
	const router = useRouter();

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		const { pin } = data;
		try {
			setError('');
			setIsLoading(true);
			const { status, message } = await submitCodeFunc(pin);

			if (status === 'ERROR') {
				setError(message || '');
				return;
			}
			return router.replace('/');
		} catch (e) {
			setError('Something went wrong, pleas try again later');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="text-center flex flex-col items-center">
			<MailCheckIcon className="size-16 md:size-20 mb-3" />
			<h1 className="text-3xl mb-3">{t('verificationCode.title')}</h1>
			<h5 className="mb-10">
				{t('verificationCode.subtitle')} <strong>{email}</strong>
			</h5>
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full mb-12">
				<Controller
					control={form.control}
					name="pin"
					render={({ field }) => (
						<Field className="mb-8">
							<InputOTP
								maxLength={6}
								autoFocus
								{...field}
								containerClassName="justify-center"
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
								</InputOTPGroup>
								<InputOTPSeparator />
								<InputOTPGroup>
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
							{error && (
								<FieldError className="text-center text-destructive">
									{t(`verificationCode.${error}`)}
								</FieldError>
							)}
						</Field>
					)}
				/>
				<ButtonLoading
					type="submit"
					className="w-full mb-3"
					isLoading={isLoading}
				>
					{t('common.continue')}
				</ButtonLoading>
				<Button
					className="w-full"
					onClick={() => backButtonFunc()}
					variant="outline"
				>
					{t('common.back')}
				</Button>
			</form>

			<Button className="underline mx-auto block" variant="link">
				{t('verificationCode.resendVerificationCode')}
			</Button>
		</div>
	);
}
