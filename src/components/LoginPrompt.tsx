'use client';
import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type LoginPromptProps = {
	className?: string;
	/** Where to come back to after signing in. */
	redirectTo?: string;
	/** The API rejected the current session; lets the login page open despite the cookies. */
	sessionExpired?: boolean;
};

export function LoginPrompt({ className, redirectTo, sessionExpired }: LoginPromptProps) {
	const params = new URLSearchParams();
	if (redirectTo) params.set('redirect', redirectTo);
	if (sessionExpired) params.set('session_expired', '1');
	const href = params.size ? `/login?${params}` : '/login';
	const { t } = useLanguage();

	return (
		<div
			className={cn(
				// From xl up it fits beside the full 640px feed and the sidebar
				'rounded-xl border border-border bg-card p-5 h-fit w-[280px] shrink-0 hidden xl:block',
				className
			)}
		>
			<h2 className="item-title font-semibold text-foreground">
				{t('loginPrompt.title')}
			</h2>
			<p className="text-[15px] text-muted-foreground mt-1.5 leading-relaxed">
				{t('loginPrompt.subtitle')}
			</p>
			<NextLink
				href={href}
				className={buttonVariants({ size: 'sm', className: 'mt-5 w-full' })}
			>
				{t('loginPrompt.ctaLabel')}
			</NextLink>
		</div>
	);
}
