'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { mergeById } from '@/lib/api/cursor';
import { apiErrorText } from '@/lib/api/error-text';
import type { UserDto } from '@/schemas/user';

import { getBlockedUsers, unblockUser } from './service';

/** Settings: people the user blocked, with a way to unblock each. */
export function BlockedUsersPanel() {
	const { t } = useLanguage();
	const [users, setUsers] = useState<UserDto[] | null>(null);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [pendingId, setPendingId] = useState<string | null>(null);
	// Bumped by Try again to run the first load once more
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		let ignore = false;
		getBlockedUsers().then((result) => {
			if (ignore) return;
			setLoadFailed(!result.ok);
			if (result.ok) {
				setUsers(result.data.items);
				setNextCursor(result.data.nextCursor);
			}
		});
		return () => {
			ignore = true;
		};
	}, [attempt]);

	const loadMore = async () => {
		if (!nextCursor) return;
		setLoadingMore(true);
		const result = await getBlockedUsers(nextCursor);
		setLoadingMore(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'blocks.loadFailed'), {
				duration: Infinity,
			});
			return;
		}
		setUsers((list) => mergeById(list ?? [], result.data.items));
		setNextCursor(result.data.nextCursor);
	};

	const unblock = async (user: UserDto) => {
		setPendingId(user.id);
		const result = await unblockUser(user.id);
		setPendingId(null);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'blocks.unblockFailed'), {
				duration: Infinity,
			});
			return;
		}
		setUsers((list) => list?.filter((u) => u.id !== user.id) ?? null);
		toast.success(t('blocks.unblocked', { username: user.username }));
	};

	return (
		<section className="space-y-3">
			<div>
				<h2 className="font-medium">{t('blocks.title')}</h2>
				<p className="text-sm text-muted-foreground">{t('blocks.intro')}</p>
			</div>
			{users === null && !loadFailed && (
				<div className="flex justify-center py-4">
					<Spinner />
				</div>
			)}
			{loadFailed && (
				<div className="empty-state space-y-3">
					<p>{t('blocks.loadFailed')}</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setLoadFailed(false);
							setAttempt((n) => n + 1);
						}}
					>
						{t('common.tryAgain')}
					</Button>
				</div>
			)}
			{users?.length === 0 && (
				<p className="empty-state">{t('blocks.empty')}</p>
			)}
			{!!users?.length && (
				<ul className="divide-y divide-border rounded-xl border border-border bg-card">
					{users.map((user) => (
						<li key={user.id} className="flex items-center gap-3 px-4 py-3">
							<UserAvatar
								username={user.username}
								avatarUrl={user.avatarUrl}
								className="size-10"
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">
									{user.displayName ?? user.username}
								</p>
								<p className="truncate font-mono text-xs text-muted-foreground">
									@{user.username}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								loading={pendingId === user.id}
								onClick={() => unblock(user)}
							>
								{t('blocks.unblock')}
							</Button>
						</li>
					))}
				</ul>
			)}
			{nextCursor && (
				<div className="flex justify-center">
					<Button
						variant="outline"
						size="sm"
						loading={loadingMore}
						onClick={loadMore}
					>
						{t('common.loadMore')}
					</Button>
				</div>
			)}
		</section>
	);
}
