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
				'rounded-xl border border-border bg-card p-5 h-fit max-w-[240px] hidden lg:block',
				className
			)}
		>
			<h4 className="text-sm font-semibold text-foreground">
				{t('loginPrompt.title')}
			</h4>
			<p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
				{t('loginPrompt.subtitle')}
			</p>
			<Button asChild size="sm" className="mt-4 w-full">
				<NextLink href="/login">{t('loginPrompt.ctaLabel')}</NextLink>
			</Button>
		</div>
	);
}
