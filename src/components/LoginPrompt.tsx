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
	/** On a poll the viewer can't open yet: adds that logging in opens it. */
	forPoll?: boolean;
};

/** A full-width card: the invitation to log in beside the Log in button, stacked on phones. */
export function LoginPrompt({ className, redirectTo, sessionExpired, forPoll }: LoginPromptProps) {
	const params = new URLSearchParams();
	if (redirectTo) params.set('redirect', redirectTo);
	if (sessionExpired) params.set('session_expired', '1');
	const href = params.size ? `/login?${params}` : '/login';
	const { t } = useLanguage();

	return (
		<div
			className={cn(
				'flex flex-col gap-4 rounded-2xl border border-border bg-card px-6 py-5 sm:flex-row sm:items-center sm:gap-5',
				className
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<h2 className="text-[18px] font-medium tracking-[-0.01em] text-foreground">{t('loginPrompt.title')}</h2>
				<p className="text-[14px] text-muted-foreground">
					{t('loginPrompt.subtitle')}
					{forPoll && ` ${t('loginPrompt.pollNote')}`}
				</p>
			</div>
			<NextLink href={href} className={buttonVariants({ className: 'w-full sm:w-auto' })}>
				{t('loginPrompt.ctaLabel')}
			</NextLink>
		</div>
	);
}
