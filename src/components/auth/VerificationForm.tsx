import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { STATUS_SIGN_IN } from './AuthContainer';
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
	FormField,
	FormItem,
	FormMessage,
} from '@/components/Form';

interface VerificationFormProps {
	email: string;
	onSetPageStatus: (value: string) => void;
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
			console.log('🚀 ~ file:52 ~ onSubmit ~ data:', data);
		} catch (e) {
			console.log('file:57 ~ onSubmit ~ e:', e);
		}
	}

	return (
		<>
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
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-2/3 mt-12 mx-auto block">
						Submit
					</Button>
					<Button
						className="w-2/3 mt-3 mx-auto block"
						onClick={() => onSetPageStatus(STATUS_SIGN_IN)}
						variant="outline"
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
