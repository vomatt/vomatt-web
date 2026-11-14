'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { EmptyCard } from '@/components/EmptyCard';
import { Button, buttonVariants } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { useUnreadCount } from '@/features/notifications/UnreadCountProvider';
import { formatDate } from '@/features/polls/format';
import { useViewerClock } from '@/features/polls/hooks/useViewerClock';
import { handle } from '@/features/profiles/name';
import type { ActionFailure } from '@/lib/api/action';
import { apiErrorText } from '@/lib/api/error-text';
import { signout } from '@/lib/api/services/auth';
import { settle } from '@/lib/api/settle';
import { META_GAP, rich } from '@/lib/rich';
import { loginHref, profileHref } from '@/lib/routes';

import { useActing, useSwitchAccount } from './ActingProvider';
import {
	accountName,
	canActAs,
	type CommunityInvitationDetail,
	communityInvitationHref,
	type MyCommunity,
} from './schema';
import { acceptCommunityInvitation, declineCommunityInvitation } from './service';

/** What the page shows: the open invitation (and which answer is on its way), its outcome, or nothing left to answer. */
type View =
	| { step: 'pending' | 'accepting' | 'declining'; invitation: CommunityInvitationDetail }
	| { step: 'accepted'; invitation: CommunityInvitationDetail; membership: MyCommunity }
	| { step: 'declined'; invitation: CommunityInvitationDetail }
	| { step: 'unavailable' };

/**
 * One community invitation, answered on its own page. `invitation` is null when the API won't show it (expired,
 * withdrawn, answered, or sent to another address). `signedInAs` is the person's email, else their @handle.
 */
export function CommunityInvitationCard({
	invitationId,
	invitation,
	signedInAs,
}: {
	invitationId: string;
	invitation: CommunityInvitationDetail | null;
	signedInAs: string | null;
}) {
	const { t } = useLanguage();
	const { refresh } = useUnreadCount();
	const { reloadCommunities } = useActing();
	// From the first render only: answering refreshes the page, whose invitation is gone by then
	const [view, setView] = useState<View>(() => (invitation ? { step: 'pending', invitation } : { step: 'unavailable' }));

	// Once an answer replaces what was here, focus follows it, so keyboard and screen reader users land on the outcome
	const frameRef = useRef<HTMLDivElement>(null);
	const firstStep = useRef(view.step);
	useEffect(() => {
		if (view.step !== firstStep.current && view.step !== 'accepting' && view.step !== 'declining') frameRef.current?.focus();
	}, [view.step]);

	const fail = (result: ActionFailure, open: CommunityInvitationDetail) => {
		if (result.errorCode === 'community.invitation.not_found') {
			setView({ step: 'unavailable' });
			refresh();
			return;
		}
		toast.error(apiErrorText(t, result));
		setView({ step: 'pending', invitation: open });
	};

	const accept = async (open: CommunityInvitationDetail) => {
		setView({ step: 'accepting', invitation: open });
		const result = await settle(acceptCommunityInvitation(open.id));
		if (!result.ok) return fail(result, open);
		setView({ step: 'accepted', invitation: open, membership: result.data });
		refresh();
		reloadCommunities();
	};

	const decline = async (open: CommunityInvitationDetail) => {
		setView({ step: 'declining', invitation: open });
		const result = await settle(declineCommunityInvitation(open.id));
		if (!result.ok) return fail(result, open);
		setView({ step: 'declined', invitation: open });
		refresh();
	};

	let body: ReactNode;
	switch (view.step) {
		case 'pending':
		case 'accepting':
		case 'declining':
			body = <Pending view={view} onAccept={() => accept(view.invitation)} onDecline={() => decline(view.invitation)} />;
			break;
		case 'accepted':
			body = <Accepted invitation={view.invitation} membership={view.membership} />;
			break;
		case 'declined':
			body = <Declined invitation={view.invitation} />;
			break;
		case 'unavailable':
			body = <Unavailable invitationId={invitationId} signedInAs={signedInAs} />;
	}
	return (
		<div ref={frameRef} tabIndex={-1} className="outline-none">
			{body}
		</div>
	);
}

function Frame({ community, children }: { community: CommunityInvitationDetail['community']; children: ReactNode }) {
	return (
		<section className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center sm:px-8">
			<UserAvatar username={community.username} avatarUrl={community.avatarUrl} className="size-14" />
			{children}
		</section>
	);
}

function Pending({
	view,
	onAccept,
	onDecline,
}: {
	view: Extract<View, { step: 'pending' | 'accepting' | 'declining' }>;
	onAccept: () => void;
	onDecline: () => void;
}) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	const { community, inviter, role, expiresAt, locked } = view.invitation;
	const busy = view.step !== 'pending';
	const meta = [
		inviter && t('communities.invitationPage.invitedBy', { name: handle(inviter.username) }),
		// Formatted once hydrated, in the viewer's time zone
		clock && t('communities.invitationPage.expires', { date: formatDate(expiresAt, clock.language) }),
	].filter(Boolean);
	return (
		<Frame community={community}>
			<div className="flex flex-col gap-1">
				<h1 className="text-title-2 text-foreground">
					{t('communities.invitationPage.pendingTitle', { name: accountName(community) })}
				</h1>
				<p className="text-body-4 text-muted-foreground">{handle(community.username)}</p>
			</div>
			<div className="w-full max-w-[420px] rounded-xl border border-border px-4 py-3 text-left">
				<p className="text-title-4 leading-snug text-foreground">
					{t('communities.invitationPage.role', { role: t(`communities.roles.${role}`) })}
				</p>
				<p className="mt-0.5 text-caption-1 text-muted-foreground">{t(`communities.roleBodies.${role}`)}</p>
			</div>
			{meta.length > 0 && <p className="text-caption-2 text-muted-foreground">{meta.join(META_GAP)}</p>}
			{locked && (
				<p className="max-w-[420px] text-body-4 text-foreground">
					{t('communities.invitationPage.locked', { name: accountName(community) })}
				</p>
			)}
			<div className="mt-2 flex flex-wrap justify-center gap-2">
				<Button loading={view.step === 'accepting'} disabled={busy || locked} onClick={onAccept}>
					{t('notifications.accept')}
				</Button>
				<Button variant="outline" loading={view.step === 'declining'} disabled={busy} onClick={onDecline}>
					{t('notifications.decline')}
				</Button>
			</div>
		</Frame>
	);
}

function Accepted({ invitation, membership }: { invitation: CommunityInvitationDetail; membership: MyCommunity }) {
	const { t } = useLanguage();
	const { switchTo, busy } = useSwitchAccount();
	const name = accountName(invitation.community);
	const href = profileHref(invitation.community.username);
	// Analysts only read result reports, so there is nothing to switch to
	const canSwitch = canActAs(membership.role);
	return (
		<Frame community={invitation.community}>
			<h1 className="text-title-2 text-foreground">
				{t(invitation.member ? 'communities.invitationPage.alreadyMemberTitle' : 'communities.invitationPage.joinedTitle', {
					name,
					role: t(`communities.roles.${membership.role}`),
				})}
			</h1>
			{canSwitch && (
				<p className="max-w-[420px] text-body-3 text-muted-foreground">{t('communities.invitationPage.joinedBody', { name })}</p>
			)}
			<div className="mt-2 flex flex-wrap justify-center gap-2">
				{canSwitch && (
					<Button loading={busy} onClick={() => switchTo(membership, href)}>
						{t('communities.invitationPage.switchTo', { name })}
					</Button>
				)}
				<Link href={href} className={buttonVariants({ variant: canSwitch ? 'outline' : 'default' })}>
					{t('communities.invitationPage.viewProfile')}
				</Link>
			</div>
		</Frame>
	);
}

function Declined({ invitation }: { invitation: CommunityInvitationDetail }) {
	const { t } = useLanguage();
	return (
		<Frame community={invitation.community}>
			<h1 className="text-title-2 text-foreground">{t('communities.invitationPage.declinedTitle')}</h1>
			<p className="max-w-[420px] text-body-3 text-muted-foreground">
				{t('communities.invitationPage.declinedBody', { name: accountName(invitation.community) })}
			</p>
			<Link href="/" className={buttonVariants({ variant: 'outline', className: 'mt-2' })}>
				{t('common.goHome')}
			</Link>
		</Frame>
	);
}

function Unavailable({ invitationId, signedInAs }: { invitationId: string; signedInAs: string | null }) {
	const { t } = useLanguage();
	const [leaving, startLeaving] = useTransition();
	// Back to this page once signed in as the other account
	const switchAccount = () => startLeaving(() => signout(loginHref({ redirect: communityInvitationHref(invitationId) })));
	return (
		<EmptyCard
			headingLevel={1}
			title={t('communities.invitationPage.unavailableTitle')}
			body={
				<>
					{t('communities.invitationPage.unavailableBody')}
					{signedInAs && (
						<>
							{' '}
							{rich(t('communities.invitationPage.signedInAs'), {
								account: <strong className="font-medium wrap-anywhere text-foreground">{signedInAs}</strong>,
							})}
						</>
					)}
				</>
			}
			action={
				<div className="flex flex-wrap justify-center gap-2">
					<Button loading={leaving} onClick={switchAccount}>
						{t('communities.invitationPage.useDifferentAccount')}
					</Button>
					<Link href="/notifications" className={buttonVariants({ variant: 'outline' })}>
						{t('common.notifications')}
					</Link>
				</div>
			}
		/>
	);
}
