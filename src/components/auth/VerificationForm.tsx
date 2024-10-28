import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import Link from 'next/link';
import { FC } from 'react';
import Button from '@/components/Button';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	InputOTPSeparator,
} from '@/components/auth/InputOTP';

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';

interface Props {
	email: string;
	length?: number;
}

const FormSchema = z.object({
	pin: z.string().min(6, {
		message: 'Your one-time password must be 6 characters.',
	}),
});

const VerificationForm: FC<Props> = ({ email, length = 6 }) => {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			pin: '',
		},
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		const { pin } = data;
		try {
			const res = await fetch('/api/login/verify-code', {
				method: 'POST',
				body: JSON.stringify({ email, verifyCode: pin }),
			});
			const data = await res.json();
		} catch (e) {}
	}

	return (
		<>
			<h5 className="t-h-5 mb-6">
				We sent an email to {email} for your login credentials
			</h5>
			<FormProvider {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="mb-12">
					<FormField
						control={form.control}
						name="pin"
						render={({ field }) => (
							<FormItem className="space-y-3 mb-3">
								<FormLabel className="t-b-1">One-Time Password</FormLabel>
								<FormControl>
									<InputOTP maxLength={6} autoFocus {...field}>
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
								</FormControl>
								<FormDescription>
									Please enter the one-time password sent to your phone.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit">Submit</Button>
				</form>
			</FormProvider>
			<p className="t-b-1">
				Need help?{' '}
				<Link href="/contact" className="underline">
					Contact support
				</Link>
			</p>
		</>
	);
};

export default VerificationForm;
