'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import type { ActionResult } from '@/lib/api/action';
import type { CursorPage } from '@/lib/api/cursor';
import { mergeById } from '@/lib/api/cursor';
import { apiErrorText } from '@/lib/api/error-text';
import type { UserDto } from '@/schemas/user';

type UserRelationPanelProps = {
	/** Locale namespace: `<ns>.title`, `.intro`, `.empty`, `.loadFailed` and the action's keys. */
	ns: 'blocks' | 'follows';
	/** Locale keys `<ns>.<action>`, `<ns>.<action>ed` and `<ns>.<action>Failed`. */
	action: 'unblock' | 'unfollow';
	load: (cursor?: string) => Promise<ActionResult<CursorPage<UserDto>>>;
	remove: (userId: string) => Promise<ActionResult>;
};

/** Settings: people the user set a one-way relation with, with a way to undo it for each. */
export function UserRelationPanel({ ns, action, load, remove }: UserRelationPanelProps) {
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
		load()
			.then((result) => {
				if (ignore) return;
				setLoadFailed(!result.ok);
				if (result.ok) {
					setUsers(result.data.items);
					setNextCursor(result.data.nextCursor);
				}
			})
			.catch(() => {
				if (!ignore) setLoadFailed(true);
			});
		return () => {
			ignore = true;
		};
	}, [attempt, load]);

	const loadMore = async () => {
		if (!nextCursor) return;
		setLoadingMore(true);
		const result = await load(nextCursor);
		setLoadingMore(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, `${ns}.loadFailed`), {
				duration: Infinity,
			});
			return;
		}
		setUsers((list) => mergeById(list ?? [], result.data.items));
		setNextCursor(result.data.nextCursor);
	};

	const undo = async (user: UserDto) => {
		setPendingId(user.id);
		const result = await remove(user.id);
		setPendingId(null);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, `${ns}.${action}Failed`), {
				duration: Infinity,
			});
			return;
		}
		setUsers((list) => list?.filter((u) => u.id !== user.id) ?? null);
		toast.success(t(`${ns}.${action}ed`, { username: user.username }));
	};

	return (
		<section className="space-y-3">
			<div>
				<h3 className="font-medium">{t(`${ns}.title`)}</h3>
				<p className="text-sm text-muted-foreground">{t(`${ns}.intro`)}</p>
			</div>
			{users === null && !loadFailed && (
				<div className="flex justify-center py-4">
					<Spinner />
				</div>
			)}
			{loadFailed && (
				<div className="empty-state space-y-3">
					<p>{t(`${ns}.loadFailed`)}</p>
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
			{users?.length === 0 && <p className="empty-state">{t(`${ns}.empty`)}</p>}
			{!!users?.length && (
				<ul className="divide-y divide-border rounded-2xl border border-border bg-card">
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
								onClick={() => undo(user)}
							>
								{t(`${ns}.${action}`)}
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
