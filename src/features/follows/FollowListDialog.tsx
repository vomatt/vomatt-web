'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { ProfileHoverCard, rememberFollowing } from '@/features/profiles/ProfileHoverCard';
import { mergeById } from '@/lib/api/cursor';
import { profileHref } from '@/lib/routes';

import { FollowButton, useFollow } from './FollowButton';
import type { FollowUserDto } from './schema';
import { getFollowers, getFollowing, getMutualFollowers } from './service';

/** Each list the dialog can show: how it loads, its title and what it says when empty. */
const lists = {
	followers: { load: getFollowers, title: 'profile.followers', empty: 'follows.listEmptyFollowers' },
	following: { load: getFollowing, title: 'profile.following', empty: 'follows.listEmptyFollowing' },
	mutuals: { load: getMutualFollowers, title: 'profile.mutualFollowers', empty: 'follows.listEmptyMutuals' },
};

export type FollowList = keyof typeof lists;

type RowProps = {
	/** The signed-in viewer, whose own row gets no Follow; the mutuals list never holds them. */
	viewerId?: string;
	/** Each change the viewer's Follow taps show, the going back of a refused one too. */
	onFollowChange?: (following: boolean) => void;
};

/** A person's followers, the people they follow, or their followers the viewer follows; each row carries Follow and opens the hover card. */
export function FollowListDialog({
	username,
	list,
	onOpenChange,
	...rowProps
}: RowProps & {
	username: string;
	/** Which list is open; null when closed. */
	list: FollowList | null;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useLanguage();

	return (
		<Dialog open={list !== null} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md" closeLabel={t('common.close')}>
				<DialogHeader>
					<DialogTitle>{list && t(lists[list].title)}</DialogTitle>
				</DialogHeader>
				{/* Keyed so switching lists starts from the first page */}
				{list && <People key={list} username={username} list={list} {...rowProps} />}
			</DialogContent>
		</Dialog>
	);
}

function People({ username, list, ...rowProps }: RowProps & { username: string; list: FollowList }) {
	const { t } = useLanguage();
	const [users, setUsers] = useState<FollowUserDto[] | null>(null);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);
	const [loading, setLoading] = useState(false);

	const receive = (result: Awaited<ReturnType<(typeof lists)[FollowList]['load']>>, cursor?: string) => {
		setLoading(false);
		if (!result.ok) return setFailed(true);
		setFailed(false);
		setUsers((current) => mergeById(cursor ? (current ?? []) : [], result.data.items));
		setNextCursor(result.data.nextCursor);
	};

	const load = async (cursor?: string) => {
		setLoading(true);
		receive(await lists[list].load(username, cursor), cursor);
	};

	// The first page, once per list (the dialog keys this by list)
	useEffect(() => {
		let ignore = false;
		lists[list].load(username).then((result) => !ignore && receive(result));
		return () => {
			ignore = true;
		};
	}, [list, username]);

	if (failed && !users) {
		return (
			<div className="empty-state space-y-3">
				<p>{t('follows.listFailed')}</p>
				<Button variant="outline" size="sm" loading={loading} onClick={() => load()}>
					{t('common.tryAgain')}
				</Button>
			</div>
		);
	}
	if (!users) {
		return (
			<div className="flex justify-center py-6">
				<Spinner />
			</div>
		);
	}
	if (users.length === 0) {
		return <p className="empty-state">{t(lists[list].empty)}</p>;
	}

	return (
		<div className="-mx-1 max-h-[60vh] space-y-3 overflow-y-auto px-1">
			<ul className="space-y-2">
				{users.map((user) => (
					<PersonRow key={user.id} user={user} {...rowProps} />
				))}
			</ul>
			{nextCursor && (
				<div className="flex justify-center">
					<Button variant="outline" size="sm" loading={loading} onClick={() => load(nextCursor)}>
						{t('common.loadMore')}
					</Button>
				</div>
			)}
		</div>
	);
}

/** Name over "@handle · follows you", and Follow on the right. */
function PersonRow({ user, viewerId, onFollowChange }: RowProps & { user: FollowUserDto }) {
	const { t } = useLanguage();
	const follow = useFollow(user.id, user, {
		isSelf: user.id === viewerId,
		onChange: (following) => {
			rememberFollowing(user.username, following);
			onFollowChange?.(following);
		},
	});

	return (
		<li className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-border-strong">
			<ProfileHoverCard username={user.username} avatarUrl={user.avatarUrl}>
				<Link
					href={profileHref(user.username)}
					className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
				>
					<UserAvatar username={user.username} avatarUrl={user.avatarUrl} />
					<span className="flex min-w-0 flex-col gap-0.5">
						<span className="truncate text-[14px] font-medium">{user.displayName || user.username}</span>
						<span className="truncate font-mono text-[12px] text-muted-foreground">
							@{user.username}
							{user.followsYou && ` · ${t('follows.followsYou')}`}
						</span>
					</span>
				</Link>
			</ProfileHoverCard>
			<FollowButton follow={follow} username={user.username} avatarUrl={user.avatarUrl} size="xs" />
		</li>
	);
}
