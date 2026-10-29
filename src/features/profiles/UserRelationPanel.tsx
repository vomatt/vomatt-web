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
	/** Locale namespace: `<ns>.title`, `.empty`, `.loadFailed` and the action's keys. */
	ns: 'blocks';
	/** Locale keys `<ns>.<action>`, `<ns>.<action>ed` and `<ns>.<action>Failed`. */
	action: 'unblock';
	load: (cursor?: string) => Promise<ActionResult<CursorPage<UserDto>>>;
	remove: (userId: string) => Promise<ActionResult>;
};

/**
 * Settings: people the user set a one-way relation with, with a way to undo it for each. A row inside a
 * settings card the host draws: the title with a mono count, then soft tiles of a 28px avatar, the @handle
 * and a 32px action.
 */
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

	const retry = () => {
		setLoadFailed(false);
		setAttempt((n) => n + 1);
	};

	return (
		<section className="space-y-2.5">
			<div className="flex items-baseline gap-2">
				<h3 className="flex-1 font-medium">{t(`${ns}.title`)}</h3>
				{/* Only once every page is in, so it is the whole count */}
				{!!users?.length && !nextCursor && (
					<span className="font-mono text-[14px] text-muted-foreground tabular-nums">{users.length}</span>
				)}
			</div>
			{users === null && !loadFailed && (
				<div className="flex justify-center py-2">
					<Spinner />
				</div>
			)}
			{loadFailed && (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<p className="flex-1 text-[13px] text-muted-foreground">{t(`${ns}.loadFailed`)}</p>
					<Button variant="outline" size="xs" onClick={retry}>
						{t('common.tryAgain')}
					</Button>
				</div>
			)}
			{users?.length === 0 && <p className="text-[13px] text-muted-foreground">{t(`${ns}.empty`)}</p>}
			{!!users?.length && (
				<ul className="flex flex-col gap-2.5">
					{users.map((user) => (
						<li
							key={user.id}
							className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-soft px-2.5 py-2"
						>
							<UserAvatar username={user.username} avatarUrl={user.avatarUrl} className="size-7" />
							<p className="min-w-0 flex-1 truncate font-mono text-[14px]">@{user.username}</p>
							<Button variant="outline" size="xs" loading={pendingId === user.id} onClick={() => undo(user)}>
								{t(`${ns}.${action}`)}
							</Button>
						</li>
					))}
				</ul>
			)}
			{nextCursor && (
				<div className="flex justify-center">
					<Button variant="outline" size="xs" loading={loadingMore} onClick={loadMore}>
						{t('common.loadMore')}
					</Button>
				</div>
			)}
		</section>
	);
}
