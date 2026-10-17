'use client';

import { useEffect } from 'react';

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

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4 text-center">
			<h1 className="text-xl font-semibold text-foreground">{t('common.error')}</h1>
			<p className="text-sm text-muted-foreground max-w-sm">
				{error.message || t('common.errorBody')}
			</p>
			<Button variant="outline" onClick={reset}>
				{t('common.tryAgain')}
			</Button>
		</div>
	);
}
