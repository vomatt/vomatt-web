'use client';

import NextLink from 'next/link';

import { Button, buttonVariants } from '@/components/ui/Button';
import { Lock } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';

type InvitationPromptProps = {
	creator: { username: string; avatarUrl: string | null };
	pollId: string;
	/** Set when signed in, but not as the invited account: signs out and back to login for this Poll. */
	switchAccount?: () => Promise<void>;
};

/** An Invitation link to an Invite-only Poll the viewer can't open yet. */
export function InvitationPrompt({ creator, pollId, switchAccount }: InvitationPromptProps) {
	const { t } = useLanguage();
	const login = `/login?${new URLSearchParams({ redirect: `/poll/${pollId}` })}`;

	return (
		<section className="flex w-full max-w-[640px] flex-col items-center gap-3 rounded-2xl border border-border bg-card px-8 py-10 text-center">
			<UserAvatar username={creator.username} avatarUrl={creator.avatarUrl} className="size-14" />
			<h1 className="text-[25px] leading-[1.2] font-medium tracking-[-0.02em] text-foreground">
				{t('poll.invitation.title', { username: creator.username })}
			</h1>
			<p className="max-w-[420px] text-base text-muted-foreground">
				{t(switchAccount ? 'poll.invitation.wrongAccount' : 'poll.invitation.signIn')}
			</p>
			<span className="inline-flex items-center gap-1.5 rounded-full bg-field px-2.5 py-1 text-[12px] font-medium text-foreground">
				<Lock aria-hidden className="size-3.5 text-tide" />
				{t('poll.audience.invite-only')}
			</span>
			{switchAccount ? (
				<form action={switchAccount} className="mt-2">
					<Button type="submit" variant="outline">
						{t('poll.invitation.switchAccount')}
					</Button>
				</form>
			) : (
				<NextLink href={login} className={buttonVariants({ className: 'mt-2' })}>
					{t('loginPrompt.ctaLabel')}
				</NextLink>
			)}
		</section>
	);
}
