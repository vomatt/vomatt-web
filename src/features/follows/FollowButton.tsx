'use client';

import { type RefObject, useState } from 'react';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Check, Plus } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';

import { followUser, unfollowUser } from './service';

/** What the Follow button offers the viewer for one person. */
export type FollowState = 'follow' | 'followBack' | 'following' | 'blocked' | 'self';

/** The viewer's relation to a person, as the API sends it; `isFollowing` is null when signed out. */
type Relation = { isFollowing: boolean | null; followsYou?: boolean | null; isBlocked?: boolean | null };

/** Null when signed out: there is no relation to act on. */
export function followState(relation: Relation, isSelf = false): FollowState | null {
	if (isSelf) return 'self';
	if (relation.isBlocked) return 'blocked';
	if (relation.isFollowing == null) return null;
	if (relation.isFollowing) return 'following';
	return relation.followsYou ? 'followBack' : 'follow';
}

/**
 * The viewer's follow of one person: it changes on the tap and goes back if the
 * server refuses. A tap holds until `relation` is replaced (compared by identity,
 * e.g. after a refresh), so a newer server answer always wins. `onChange` hears
 * every change shown, the going back too; `delta` is how far the taps moved the
 * person's follower count (-1, 0 or 1). `confirming` is the unfollow confirm,
 * open only while following.
 */
export function useFollow(
	userId: string,
	relation: Relation,
	{ isSelf = false, onChange }: { isSelf?: boolean; onChange?: (following: boolean) => void } = {}
) {
	const { t } = useLanguage();
	const [tapped, setTapped] = useState<{ on: Relation; following: boolean } | null>(null);
	const [isPending, setIsPending] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const following = tapped?.on === relation ? tapped.following : relation.isFollowing;
	// Closed once no longer following (e.g. a refresh), so it never reopens by itself later
	if (confirming && !following) setConfirming(false);

	const show = (value: boolean) => {
		setTapped({ on: relation, following: value });
		onChange?.(value);
	};

	const toggle = async () => {
		const next = !following;
		show(next);
		setIsPending(true);
		const result = await settle(next ? followUser(userId) : unfollowUser(userId));
		setIsPending(false);
		if (!result.ok) {
			show(!next);
			toast.error(apiErrorText(t, result, next ? 'follows.followFailed' : 'follows.unfollowFailed'));
		}
	};

	return {
		state: followState({ ...relation, isFollowing: following }, isSelf),
		toggle,
		isPending,
		confirming,
		setConfirming,
		delta: Number(!!following) - Number(!!relation.isFollowing),
	};
}

export type Follow = ReturnType<typeof useFollow>;

/**
 * The one Follow button, wherever a person is. Ink while not following, as
 * Follow back when they follow the viewer; once following it drops to outline
 * (the page's primary action stays Create) and tapping it opens the unfollow
 * confirm. Blocked once the viewer blocked them; nothing signed out or on the
 * viewer's own entry.
 * `size`: `sm` (36px) in a profile header, `xs` (32px) on the hover card and in rows.
 * `withConfirm={false}` when the host renders `UnfollowDialog` itself.
 */
export function FollowButton({
	follow,
	username,
	avatarUrl,
	size = 'sm',
	className,
	withConfirm = true,
}: {
	follow: Follow;
	username: string;
	avatarUrl?: string | null;
	size?: 'sm' | 'xs';
	className?: string;
	withConfirm?: boolean;
}) {
	const { t } = useLanguage();

	switch (follow.state) {
		case null:
		case 'self':
			return null;
		case 'blocked':
			return <BlockedBadge />;
		case 'follow':
		case 'followBack':
			return (
				<Button size={size} onClick={follow.toggle} disabled={follow.isPending} className={className}>
					{follow.state === 'follow' && <Plus aria-hidden />}
					{t(follow.state === 'follow' ? 'follows.follow' : 'follows.followBack')}
				</Button>
			);
		case 'following':
			return (
				<>
					<Button
						size={size}
						variant="outline"
						aria-haspopup="dialog"
						onClick={() => follow.setConfirming(true)}
						disabled={follow.isPending}
						className={className}
					>
						<Check aria-hidden />
						{t('follows.following')}
					</Button>
					{withConfirm && <UnfollowDialog follow={follow} username={username} avatarUrl={avatarUrl} />}
				</>
			);
	}
}

/**
 * Confirms, then unfollows, with the person's avatar. Mounted from its first
 * open, so rows that never ask cost nothing. `finalFocus` where focus goes on close.
 */
export function UnfollowDialog({
	follow,
	username,
	avatarUrl,
	finalFocus,
}: {
	follow: Follow;
	username: string;
	avatarUrl?: string | null;
	finalFocus?: RefObject<HTMLElement | null>;
}) {
	const { t } = useLanguage();
	const [opened, setOpened] = useState(false);
	if (follow.confirming && !opened) setOpened(true);
	if (!opened) return null;

	return (
		<AlertDialog open={follow.confirming} onOpenChange={follow.setConfirming}>
			<AlertDialogContent finalFocus={finalFocus} className="gap-6 sm:max-w-xs">
				<AlertDialogHeader className="items-center gap-4 text-center">
					<UserAvatar username={username} avatarUrl={avatarUrl} className="size-16" />
					<AlertDialogTitle className="break-all">{t('follows.confirmUnfollow', { username })}</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogFooter className="grid grid-cols-2">
					<AlertDialogCancel size="md">{t('common.cancel')}</AlertDialogCancel>
					<AlertDialogAction
						size="md"
						variant="destructive"
						onClick={() => {
							follow.setConfirming(false);
							follow.toggle();
						}}
					>
						{t('follows.unfollow')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

/** In place of Follow once the viewer blocked the person; unblocking lives in the ••• menu and Settings. */
function BlockedBadge() {
	const { t } = useLanguage();
	return (
		<span className="inline-flex h-11 items-center rounded-(--radius) border border-border bg-secondary px-3 text-caption-1 font-medium text-muted-foreground md:h-9">
			{t('blocks.blockedBadge')}
		</span>
	);
}
