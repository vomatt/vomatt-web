'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { ProfileHoverCard } from '@/features/profiles/ProfileHoverCard';
import { mergeById } from '@/lib/api/cursor';
import { profileHref } from '@/lib/routes';
import type { UserDto } from '@/schemas/user';

import { getFollowers, getFollowing } from './service';

export type FollowList = 'followers' | 'following';

const loaders = { followers: getFollowers, following: getFollowing };

/** A person's followers or the people they follow; each row opens the hover card, which carries Follow. */
export function FollowListDialog({
	username,
	list,
	onOpenChange,
}: {
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
					<DialogTitle>{t(list === 'following' ? 'profile.following' : 'profile.followers')}</DialogTitle>
				</DialogHeader>
				{/* Keyed so switching lists starts from the first page */}
				{list && <People key={list} username={username} list={list} />}
			</DialogContent>
		</Dialog>
	);
}

function People({ username, list }: { username: string; list: FollowList }) {
	const { t } = useLanguage();
	const [users, setUsers] = useState<UserDto[] | null>(null);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);
	const [loading, setLoading] = useState(false);

	const receive = (result: Awaited<ReturnType<(typeof loaders)[FollowList]>>, cursor?: string) => {
		setLoading(false);
		if (!result.ok) return setFailed(true);
		setFailed(false);
		setUsers((current) => mergeById(cursor ? (current ?? []) : [], result.data.items));
		setNextCursor(result.data.nextCursor);
	};

	const load = async (cursor?: string) => {
		setLoading(true);
		receive(await loaders[list](username, cursor), cursor);
	};

	// The first page, once per list (the dialog keys this by list)
	useEffect(() => {
		let ignore = false;
		loaders[list](username).then((result) => !ignore && receive(result));
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
		return <p className="empty-state">{t(list === 'following' ? 'follows.listEmptyFollowing' : 'follows.listEmptyFollowers')}</p>;
	}

	return (
		<div className="-mx-1 max-h-[60vh] space-y-3 overflow-y-auto px-1">
			<ul className="space-y-2">
				{users.map((user) => (
					<li key={user.id}>
						<ProfileHoverCard username={user.username} avatarUrl={user.avatarUrl}>
							<Link
								href={profileHref(user.username)}
								className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors outline-none hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
							>
								<UserAvatar username={user.username} avatarUrl={user.avatarUrl} />
								<span className="flex min-w-0 flex-col gap-0.5">
									<span className="truncate text-[14px] font-medium">{user.displayName || user.username}</span>
									<span className="truncate font-mono text-[12px] text-muted-foreground">@{user.username}</span>
								</span>
							</Link>
						</ProfileHoverCard>
					</li>
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
