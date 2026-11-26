'use client';
import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { loginHref } from '@/lib/routes';
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

/**
 * A full-width card: the invitation to log in beside the Log in button. On phones the feed's is one row with
 * the title alone, so the first poll starts higher; a locked poll's keeps its explanation and stacks.
 */
export function LoginPrompt({ className, redirectTo, sessionExpired, forPoll }: LoginPromptProps) {
	const href = loginHref({ redirect: redirectTo, sessionExpired: sessionExpired ? '1' : undefined });
	const { t } = useLanguage();

	return (
		<div
			data-nosnippet
			className={cn(
				// No border and the poll card's side padding, so its text lines up with the cards under it
				'flex gap-4 rounded-2xl bg-card px-5 py-4 forced-colors:border sm:flex-row sm:items-center sm:gap-5 sm:py-5 md:px-8',
				forPoll ? 'flex-col' : 'items-center',
				className
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<h2 className="text-title-4 text-foreground">{t('loginPrompt.title')}</h2>
				<p className={cn('text-body-4 text-muted-foreground', !forPoll && 'max-sm:hidden')}>
					{t('loginPrompt.subtitle')}
					{forPoll && ` ${t('loginPrompt.pollNote')}`}
				</p>
			</div>
			<NextLink href={href} className={buttonVariants({ className: forPoll ? 'w-full sm:w-auto' : 'shrink-0' })}>
				{t('loginPrompt.ctaLabel')}
			</NextLink>
		</div>
	);
}
