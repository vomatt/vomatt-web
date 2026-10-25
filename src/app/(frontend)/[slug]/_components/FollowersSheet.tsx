'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { getFollowers, getFollowing } from '@/features/follows/service';
import { mergeById } from '@/lib/api/cursor';
import { profileHref } from '@/lib/routes';
import type { UserDto } from '@/schemas/user';

interface FollowersSheetProps {
	username: string;
	type: 'followers' | 'following';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type FetchState = 'loading' | 'success' | 'error';

/** Who follows a user, or whom they follow; signed-in viewers only. */
export default function FollowersSheet({ username, type, open, onOpenChange }: FollowersSheetProps) {
	const { t } = useLanguage();
	const [fetchState, setFetchState] = useState<FetchState>('loading');
	const [users, setUsers] = useState<UserDto[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loadingMore, setLoadingMore] = useState(false);
	const [loadMoreFailed, setLoadMoreFailed] = useState(false);
	// Bumped by Try again to run the first load once more
	const [attempt, setAttempt] = useState(0);

	const load = type === 'followers' ? getFollowers : getFollowing;
	const loadRef = useRef(load);
	const openRef = useRef(open);
	useEffect(() => {
		loadRef.current = load;
		openRef.current = open;
	}, [load, open]);

	useEffect(() => {
		if (!open) return;
		let ignore = false;
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset before each fetch so a reopened sheet never shows stale users
		setFetchState('loading');
		setUsers([]);
		setNextCursor(null);
		setLoadMoreFailed(false);
		setLoadingMore(false);
		load(username)
			.then((result) => {
				if (ignore) return;
				if (!result.ok) {
					setFetchState('error');
					return;
				}
				setUsers(result.data.items);
				setNextCursor(result.data.nextCursor);
				setFetchState('success');
			})
			.catch(() => {
				if (!ignore) setFetchState('error');
			});
		return () => {
			ignore = true;
		};
	}, [open, username, load, attempt]);

	const loadMore = async () => {
		if (!nextCursor) return;
		setLoadingMore(true);
		setLoadMoreFailed(false);
		const result = await load(username, nextCursor).catch(() => null);
		// The sheet closed or switched list meanwhile: this page belongs to the old list
		if (loadRef.current !== load || !openRef.current) return;
		setLoadingMore(false);
		if (!result?.ok) {
			setLoadMoreFailed(true);
			return;
		}
		setUsers((list) => mergeById(list, result.data.items));
		setNextCursor(result.data.nextCursor);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>{t(type === 'followers' ? 'profile.followers' : 'profile.following')}</SheetTitle>
				</SheetHeader>

				<div className="mt-4 flex flex-col gap-1 px-4">
					{fetchState === 'loading' &&
						Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center gap-3 py-2">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex flex-1 flex-col gap-1.5">
									<Skeleton className="h-3 w-32" />
									<Skeleton className="h-3 w-20" />
								</div>
							</div>
						))}

					{fetchState === 'error' && (
						<div className="empty-state space-y-3">
							<p>{t('profile.listFailed')}</p>
							<Button variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
								{t('common.tryAgain')}
							</Button>
						</div>
					)}

					{fetchState === 'success' && users.length === 0 && (
						<p className="empty-state">
							{t(type === 'followers' ? 'profile.noFollowers' : 'profile.noFollowing')}
						</p>
					)}

					{fetchState === 'success' &&
						users.map((user) => (
							<Link
								key={user.id}
								href={profileHref(user.username)}
								onClick={() => onOpenChange(false)}
								className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
							>
								<UserAvatar username={user.username} avatarUrl={user.avatarUrl} className="size-10" />
								<div className="min-w-0">
									<p className="truncate text-sm font-medium text-foreground">
										{user.displayName ?? user.username}
									</p>
									<p className="truncate font-mono text-xs text-muted-foreground">@{user.username}</p>
								</div>
							</Link>
						))}

					{fetchState === 'success' && loadMoreFailed && (
						<p className="py-2 text-center text-sm text-muted-foreground">{t('profile.listFailed')}</p>
					)}
					{fetchState === 'success' && nextCursor && (
						<div className="flex justify-center py-2">
							<Button variant="outline" size="sm" loading={loadingMore} onClick={loadMore}>
								{t('common.loadMore')}
							</Button>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
