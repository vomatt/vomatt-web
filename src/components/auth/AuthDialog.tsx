'use client';

import { useRouter } from 'next/navigation';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';

import { AuthFlow } from './AuthFlow';

interface AuthDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAuthSuccess: () => void;
}

/** Sign-in without leaving the page; the started action resumes after it. */
export function AuthDialog({ open, onOpenChange, onAuthSuccess }: AuthDialogProps) {
	const { t } = useLanguage();
	const router = useRouter();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="sr-only">
					<DialogTitle>{t('login.title')}</DialogTitle>
					<DialogDescription>{t('login.dialogDescription')}</DialogDescription>
				</DialogHeader>
				{/* Unmounted on close, so reopening starts from the email step */}
				{open && (
					<AuthFlow
						variant="login"
						onDone={() => {
							onAuthSuccess();
							// Server-rendered parts (sidebar, viewer state) pick up the new session
							router.refresh();
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
