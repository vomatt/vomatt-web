'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';
import { getPasskeyRegistrationOptions, verifyPasskeyRegistration } from '@/lib/api/services/auth';

/** The user closed the browser's passkey sheet, or it timed out: nothing to report. */
const CANCELLED = ['NotAllowedError', 'AbortError'];

/** Registers a passkey on this device for the signed-in account. Render it only when useSupportsPasskeys(). */
export function AddPasskeyButton() {
	const { t } = useLanguage();
	const [isAdding, setIsAdding] = useState(false);

	const add = async () => {
		setIsAdding(true);
		try {
			const options = await getPasskeyRegistrationOptions();
			if (!options.ok) {
				toast.error(apiErrorText(t, options, 'passkey.addFailed'), { duration: Infinity });
				return;
			}
			let credential: Credential | null;
			try {
				credential = await navigator.credentials.create({
					publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options.data),
				});
			} catch (error) {
				const name = (error as { name?: string } | null)?.name ?? '';
				if (CANCELLED.includes(name)) return;
				// excludeCredentials matched: this authenticator already holds one
				toast.error(t(name === 'InvalidStateError' ? 'passkey.alreadyAdded' : 'passkey.addFailed'), {
					duration: Infinity,
				});
				return;
			}
			if (!credential) return;
			const result = await verifyPasskeyRegistration((credential as PublicKeyCredential).toJSON());
			if (!result.ok) {
				const text =
					result.errorCode === 'common.conflict' ? t('passkey.alreadyAdded') : apiErrorText(t, result, 'passkey.addFailed');
				toast.error(text, { duration: Infinity });
				return;
			}
			toast.success(t('passkey.added'));
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<Button variant="outline" size="md" loading={isAdding} onClick={add}>
			{t('passkey.add')}
		</Button>
	);
}
