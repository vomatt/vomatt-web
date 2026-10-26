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
import { cn } from '@/lib/utils';
import type { UserDto } from '@/schemas/user';

type UserRelationPanelProps = {
	/** Locale namespace: `<ns>.title`, `.intro`, `.empty`, `.loadFailed` and the action's keys. */
	ns: 'blocks' | 'follows';
	/** Locale keys `<ns>.<action>`, `<ns>.<action>ed` and `<ns>.<action>Failed`. */
	action: 'unblock' | 'unfollow';
	load: (cursor?: string) => Promise<ActionResult<CursorPage<UserDto>>>;
	remove: (userId: string) => Promise<ActionResult>;
	/**
	 * panel: a section of its own (title, intro, a card list of name + @handle rows).
	 * embedded: a row inside a settings card the host draws: the title with a mono count,
	 * then soft tiles of a 28px avatar, the @handle and a 32px action.
	 */
	variant?: 'panel' | 'embedded';
};

/** Settings: people the user set a one-way relation with, with a way to undo it for each. */
export function UserRelationPanel({ ns, action, load, remove, variant = 'panel' }: UserRelationPanelProps) {
	const embedded = variant === 'embedded';
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
		<section className={embedded ? 'space-y-2.5' : 'space-y-3'}>
			{embedded ? (
				<div className="flex items-baseline gap-2">
					<h3 className="flex-1 font-medium">{t(`${ns}.title`)}</h3>
					{/* Only once every page is in, so it is the whole count */}
					{!!users?.length && !nextCursor && (
						<span className="font-mono text-[14px] text-muted-foreground tabular-nums">{users.length}</span>
					)}
				</div>
			) : (
				<div>
					<h3 className="font-medium">{t(`${ns}.title`)}</h3>
					<p className="text-sm text-muted-foreground">{t(`${ns}.intro`)}</p>
				</div>
			)}
			{users === null && !loadFailed && (
				<div className={cn('flex justify-center', embedded ? 'py-2' : 'py-4')}>
					<Spinner />
				</div>
			)}
			{loadFailed &&
				(embedded ? (
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
						<p className="flex-1 text-[13px] text-muted-foreground">{t(`${ns}.loadFailed`)}</p>
						<Button variant="outline" size="xs" onClick={retry}>
							{t('common.tryAgain')}
						</Button>
					</div>
				) : (
					<div className="empty-state space-y-3">
						<p>{t(`${ns}.loadFailed`)}</p>
						<Button variant="outline" size="sm" onClick={retry}>
							{t('common.tryAgain')}
						</Button>
					</div>
				))}
			{users?.length === 0 &&
				(embedded ? (
					<p className="text-[13px] text-muted-foreground">{t(`${ns}.empty`)}</p>
				) : (
					<p className="empty-state">{t(`${ns}.empty`)}</p>
				))}
			{!!users?.length &&
				(embedded ? (
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
				) : (
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
				))}
			{nextCursor && (
				<div className="flex justify-center">
					<Button
						variant="outline"
						size={embedded ? 'xs' : 'sm'}
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
