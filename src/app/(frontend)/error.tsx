'use client';

import { useEffect } from 'react';

import { EmptyCard } from '@/components/EmptyCard';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const { t } = useLanguage();

	useEffect(() => {
		console.error(error);
	}, [error]);

	// The raw message stays in the console: it is written for developers, not for the reader
	return (
		<PageShell>
			<EmptyCard
				className="max-w-feed"
				headingLevel={1}
				title={t('common.error')}
				body={t('common.errorBody')}
				action={<Button onClick={reset}>{t('common.tryAgain')}</Button>}
			/>
		</PageShell>
	);
}
