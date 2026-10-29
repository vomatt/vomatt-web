'use client';

import type { PortableTextBlock } from '@portabletext/react';
import { useEffect, useRef, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';

import { AuthFlow } from './AuthFlow';
import { getPolicyMessage } from './policy';

interface AuthDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAuthSuccess: () => void;
}

/** Sign-in without leaving the page; the started action resumes after it. */
export function AuthDialog({ open, onOpenChange, onAuthSuccess }: AuthDialogProps) {
	const { t } = useLanguage();
	const [policyMessage, setPolicyMessage] = useState<PortableTextBlock[] | null>(null);
	// Past the code, the account is signed in; closing at the name step must still resume the action
	const signedIn = useRef(false);

	useEffect(() => {
		let active = true;
		getPolicyMessage()
			.then((blocks) => {
				if (active) setPolicyMessage(blocks);
			})
			.catch((error) => console.error('Failed to load the sign-up terms', error));
		return () => {
			active = false;
		};
	}, []);

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next && signedIn.current) onAuthSuccess();
				else onOpenChange(next);
			}}
		>
			<DialogContent
				// Pinned near the top on desktop, so the title stays put as the steps change height
				className="rounded-2xl p-7 sm:max-w-[420px] md:top-[120px] md:max-h-[calc(100dvh-136px)] md:translate-y-0"
				closeLabel={t('common.close')}
			>
				{/* Unmounted on close, so reopening starts from the email step */}
				{open && (
					<AuthFlow
						inDialog
						policyMessage={policyMessage}
						// Setting the session cookies re-renders the page, so the sidebar updates on its own
						onDone={onAuthSuccess}
						onSignedIn={() => {
							signedIn.current = true;
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
