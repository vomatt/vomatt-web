'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { EmptyCard } from '@/components/EmptyCard';
import { FilterPills } from '@/components/FilterPills';
import { LoadMore } from '@/components/LoadMore';
import { Button } from '@/components/ui/Button';
import { ChevronRight } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCursorList } from '@/hooks/useCursorList';
import { useHydrated } from '@/hooks/useHydrated';
import type { CursorPage } from '@/lib/api/cursor';

import { type Entry, entryItems, groupFollows, NotificationRow } from './NotificationRows';
import { preferencesSummary } from './preferences';
import {
	type Notification,
	NOTIFICATION_CATEGORIES,
	type NotificationCategory,
	type NotificationPreferences,
} from './schema';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from './service';
import { useUnreadCount } from './UnreadCountProvider';

export type DayGroup = 'today' | 'yesterday' | 'earlier';

/** Which day a moment falls on, in the reader's own calendar. */
export function dayGroup(iso: string, now = new Date()): DayGroup {
	const day = new Date(iso);
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	if (day.getTime() >= startOfToday) return 'today';
	if (day.getTime() >= startOfToday - 86_400_000) return 'yesterday';
	return 'earlier';
}

/** The page's title and intro, with the list's action beside them; the loading page shows it without one. */
export function NotificationsHeader({ action }: { action?: React.ReactNode }) {
	const { t } = useLanguage();
	return (
		<div className="flex flex-wrap items-end gap-4">
			<div className="flex-[1_1_300px]">
				<h1 className="page-title text-foreground">{t('notifications.title')}</h1>
				<p className="mt-1.5 text-[14px] text-muted-foreground">{t('notifications.intro')}</p>
			</div>
			{action}
		</div>
	);
}

/**
 * The feed, newest first, grouped by day, with each run of follows as one row. Results
 * rows stay until opened, so a sealed promise is never lost in the list.
 */
export function NotificationList({
	initialPage,
	viewerUsername,
}: {
	/** Null when the feed couldn't be loaded. */
	initialPage: CursorPage<Notification> | null;
	viewerUsername: string;
}) {
	const { t } = useLanguage();
	const { count: unreadCount, refresh } = useUnreadCount();
	// The tab the loaded pages belong to; Load more reads it so its cursors stay with one category
	const categoryRef = useRef<NotificationCategory | undefined>(undefined);
	const fetchPage = useCallback((cursor: string) => getNotifications(cursor, categoryRef.current), []);
	const list = useCursorList(initialPage, fetchPage);
	const [category, setCategory] = useState<NotificationCategory | 'all'>('all');
	const [isSwitching, setIsSwitching] = useState(false);
	const [filter, setFilter] = useState<'all' | 'unread'>('all');
	const [isMarking, setIsMarking] = useState(false);
	// Days follow the reader's clock, so the grouping waits for hydration
	const isHydrated = useHydrated();

	const unread = list.items.filter((item) => !item.read);
	const shown = filter === 'unread' ? unread : list.items;

	const setRead = (ids: Set<string>) =>
		list.setItems((items) => items.map((item) => (ids.has(item.id) ? { ...item, read: true } : item)));

	// The dot clears at once; a failed request leaves it unread on the server, so the next visit shows it again
	const open = (entry: Entry) => {
		const ids = entryItems(entry)
			.filter((item) => !item.read)
			.map((item) => item.id);
		if (ids.length === 0) return;
		setRead(new Set(ids));
		Promise.all(ids.map((id) => markNotificationRead(id))).then(refresh);
	};

	const markAllRead = async () => {
		setIsMarking(true);
		const result = await markAllNotificationsRead();
		setIsMarking(false);
		if (!result.ok) {
			toast.error(t('notifications.markAllFailed'));
			return;
		}
		setRead(new Set(unread.map((item) => item.id)));
		refresh();
	};

	const changeCategory = async (next: NotificationCategory | 'all') => {
		if (next === category || isSwitching) return;
		setIsSwitching(true);
		try {
			const nextCategory = next === 'all' ? undefined : next;
			list.reset(await getNotifications(null, nextCategory));
			categoryRef.current = nextCategory;
			setCategory(next);
		} catch {
			toast.error(t('notifications.categoryFailed'));
		} finally {
			setIsSwitching(false);
		}
	};

	if (initialPage === null) {
		return (
			<>
				<NotificationsHeader />
				<p className="py-16 text-center text-muted-foreground">{t('notifications.loadFailed')}</p>
			</>
		);
	}
	// Unknown kinds are left out, so an empty page can still have more, or unread ones, after it
	if (list.items.length === 0 && !list.hasMore && unreadCount === 0 && category === 'all') {
		return (
			<>
				<NotificationsHeader />
				<EmptyCard title={t('notifications.empty')} body={t('notifications.emptyHint')} />
			</>
		);
	}

	const groups = (['today', 'yesterday', 'earlier'] as const)
		.map((group) => ({
			group,
			entries: groupFollows(shown.filter((item) => isHydrated && dayGroup(item.createdAt) === group)),
		}))
		.filter((group) => group.entries.length > 0);
	const rows = (entries: Entry[]) => (
		<ul className="flex flex-col gap-2">
			{entries.map((entry) => (
				<NotificationRow key={entry.id} entry={entry} onOpen={() => open(entry)} viewerUsername={viewerUsername} />
			))}
		</ul>
	);

	return (
		<>
			<NotificationsHeader
				action={
					<Button
						variant="outline"
						size="sm"
						className="text-[14px]"
						loading={isMarking}
						// Unread ones may sit past the loaded pages; read-all reaches them too
						disabled={unread.length === 0 && unreadCount === 0}
						onClick={markAllRead}
					>
						{t('notifications.markAllRead')}
					</Button>
				}
			/>
			<div className="flex flex-col gap-4">
				<FilterPills
					label={t('profile.filterLabel')}
					value={filter}
					onChange={setFilter}
					options={[
						{ value: 'all', label: t('profile.filterAll') },
						{ value: 'unread', label: t('notifications.unread'), count: unread.length },
					]}
				/>

				<FilterPills
					label={t('notifications.categoryLabel')}
					value={category}
					onChange={changeCategory}
					options={[
						{ value: 'all', label: t('profile.filterAll') },
						...NOTIFICATION_CATEGORIES.map((value) => ({ value, label: t(`notifications.category.${value}`) })),
					]}
				/>

				{shown.length === 0 && (
					<p className="empty-state">
						{t(category === 'all' || filter === 'unread' ? 'notifications.caughtUp' : 'notifications.categoryEmpty')}
					</p>
				)}
				{!isHydrated && rows(groupFollows(shown))}
				{groups.map(({ group, entries }) => (
					<section key={group} aria-labelledby={`day-${group}`} className="flex flex-col gap-2">
						<h2 id={`day-${group}`} className="mx-0.5 text-[12px] font-medium text-muted-foreground">
							{t(`notifications.day.${group}`)}
						</h2>
						{rows(entries)}
					</section>
				))}
				<LoadMore list={list} />
			</div>
		</>
	);
}

/** The aside's way to Settings, saying which kinds are on; without the summary when it couldn't be loaded. */
export function NotificationSettingsLink({ preferences }: { preferences: NotificationPreferences | null }) {
	const { t } = useLanguage();
	return (
		<Link
			href="/settings#notifications"
			className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors outline-none hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
		>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="text-[14px] font-medium">{t('notifications.settingsTitle')}</span>
				{preferences && <span className="text-[12px] text-muted-foreground">{preferencesSummary(preferences, t)}</span>}
			</span>
			<ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
		</Link>
	);
}
