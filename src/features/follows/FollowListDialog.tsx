'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserChip } from '@/features/profiles/UserChip';
import { mergeById } from '@/lib/api/cursor';
import type { FollowUserDto } from '@/schemas/user';

import { getFollowers, getFollowing, getMutualFollowers } from './service';

export type FollowList = 'followers' | 'following' | 'mutual';

const loaders = { followers: getFollowers, following: getFollowing, mutual: getMutualFollowers };
const titles = { followers: 'profile.followers', following: 'profile.following', mutual: 'profile.mutualFollowers' };
const empties = {
	followers: 'follows.listEmptyFollowers',
	following: 'follows.listEmptyFollowing',
	mutual: 'follows.listEmptyMutual',
};

/** A person's followers or the people they follow; each name opens the hover card, which carries Follow. */
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
					<DialogTitle>{list && t(titles[list])}</DialogTitle>
				</DialogHeader>
				{/* Keyed so switching lists starts from the first page */}
				{list && <People key={list} username={username} list={list} />}
			</DialogContent>
		</Dialog>
	);
}

function People({ username, list }: { username: string; list: FollowList }) {
	const { t } = useLanguage();
	const [users, setUsers] = useState<FollowUserDto[] | null>(null);
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
		return <p className="empty-state">{t(empties[list])}</p>;
	}

	return (
		<div className="-mx-1 max-h-[60vh] space-y-3 overflow-y-auto px-1">
			<ul className="divide-y divide-border">
				{users.map((user) => (
					<li key={user.id} className="flex min-h-14 items-center gap-3 py-2">
						<UserChip
							username={user.username}
							avatarUrl={user.avatarUrl}
							label={user.displayName || user.username}
							className="gap-3 text-[14px] font-medium"
							avatarClassName="size-9"
						/>
						{user.displayName && (
							<span className="truncate font-mono text-[12px] text-muted-foreground">@{user.username}</span>
						)}
						{user.followsYou && (
							<span className="ml-auto shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
								{t('follows.followsYou')}
							</span>
						)}
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
