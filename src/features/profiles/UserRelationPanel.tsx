'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { rowClassName, SettingsCard } from '@/components/SettingsCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { shownName } from '@/features/profiles/name';
import { NameAndHandle } from '@/features/profiles/UserChip';
import type { ActionResult } from '@/lib/api/action';
import type { CursorPage } from '@/lib/api/cursor';
import { mergeById } from '@/lib/api/cursor';
import { apiErrorText } from '@/lib/api/error-text';
import type { UserDto } from '@/schemas/user';

type UserRelationPanelProps = {
	/** Locale namespace: `<ns>.empty`, `.loadFailed` and the action's keys. */
	ns: 'blocks';
	/** Locale keys `<ns>.<action>`, `<ns>.<action>Label`, `<ns>.<action>ed` and `<ns>.<action>Failed`. */
	action: 'unblock';
	load: (cursor?: string) => Promise<ActionResult<CursorPage<UserDto>>>;
	remove: (userId: string) => Promise<ActionResult>;
};

/**
 * The Blocked people page body: people the user set a one-way relation with, each a row of a settings card
 * with a 36px avatar, the @handle and a 32px action to undo it. The page header names the list.
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
		<div className="flex flex-col gap-3">
			{users === null && !loadFailed && (
				<div className="flex justify-center py-2">
					<Spinner />
				</div>
			)}
			{loadFailed && (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<p className="flex-1 text-body-4 text-muted-foreground">{t(`${ns}.loadFailed`)}</p>
					<Button variant="outline" size="md" onClick={retry}>
						{t('common.tryAgain')}
					</Button>
				</div>
			)}
			{/* Unblocking a whole page can empty the list while more remain behind Load more */}
			{users?.length === 0 && !nextCursor && <p className="empty-state">{t(`${ns}.empty`)}</p>}
			{!!users?.length && (
				<SettingsCard as="ul">
					{users.map((user) => (
						<li key={user.id} className={rowClassName}>
							<UserAvatar username={user.username} avatarUrl={user.avatarUrl} className="size-9" />
							<p className="flex min-w-0 flex-1 font-medium">
								<NameAndHandle name={shownName(user)} username={user.username} fallback={`@${user.username}`} />
							</p>
							<Button
								variant="outline"
								size="xs"
								loading={pendingId === user.id}
								onClick={() => undo(user)}
								aria-label={t(`${ns}.${action}Label`, { username: user.username })}
							>
								{t(`${ns}.${action}`)}
							</Button>
						</li>
					))}
				</SettingsCard>
			)}
			{nextCursor && (
				<div className="flex justify-center">
					<Button variant="outline" size="md" loading={loadingMore} onClick={loadMore}>
						{t('common.loadMore')}
					</Button>
				</div>
			)}
		</div>
	);
}
