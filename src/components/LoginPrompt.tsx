'use client';
import NextLink from 'next/link';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type LoginPromptProps = {
	className?: string;
};

export function LoginPrompt({ className }: LoginPromptProps) {
	const { t } = useLanguage();

	return (
		<div
			className={cn(
				'bg-secondary text-secondary-foreground rounded-xl p-6 h-fit text-center max-w-sm hidden lg:block',
				className
			)}
		>
			<h4 className="text-white font-bold text-2xl">
				{t('loginPrompt.title')}
			</h4>
			<p className="text-gray mt-2">{t('loginPrompt.subtitle')}</p>
			<Button asChild className="mt-5">
				<NextLink href="/login">{t('loginPrompt.ctaLabel')}</NextLink>
			</Button>
		</div>
	);
}
