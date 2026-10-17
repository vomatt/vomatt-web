'use client';

import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';

type InvitationPromptProps = {
	creator: { username: string; avatarUrl: string | null };
	pollId: string;
	/** Signed in, but not as the invited account. */
	signedIn: boolean;
};

/** An Invitation link to an Invite-only Poll the viewer can't open yet. */
export function InvitationPrompt({ creator, pollId, signedIn }: InvitationPromptProps) {
	const { t } = useLanguage();
	const login = `/login?${new URLSearchParams({ redirect: `/poll/${pollId}` })}`;

	return (
		<div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-5">
			<UserAvatar username={creator.username} avatarUrl={creator.avatarUrl} className="size-10" />
			<h1 className="item-title mt-3 font-semibold text-foreground">
				{t('poll.invitation.title', { username: creator.username })}
			</h1>
			<p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
				{t(signedIn ? 'poll.invitation.wrongAccount' : 'poll.invitation.signIn')}
			</p>
			{!signedIn && (
				<NextLink href={login} className={buttonVariants({ size: 'sm', className: 'mt-5 w-full' })}>
					{t('loginPrompt.ctaLabel')}
				</NextLink>
			)}
		</div>
	);
}
