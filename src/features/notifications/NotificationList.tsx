'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { EmptyCard } from '@/components/EmptyCard';
import { FilterPills } from '@/components/FilterPills';
import { LoadMore } from '@/components/LoadMore';
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
import { getNotifications } from './service';
import { useUnreadCount } from './UnreadCountProvider';
import { useMarkRead } from './useMarkRead';

export type DayGroup = 'today' | 'yesterday' | 'earlier';

/** Which day a moment falls on, in the reader's own calendar. */
export function dayGroup(iso: string, now = new Date()): DayGroup {
	const day = new Date(iso);
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	if (day.getTime() >= startOfToday) return 'today';
	if (day.getTime() >= startOfToday - 86_400_000) return 'yesterday';
	return 'earlier';
}

/** The page's title. */
export function NotificationsHeader() {
	const { t } = useLanguage();
	return <h1 className="text-title-1 text-foreground">{t('notifications.title')}</h1>;
}

/**
 * The feed, newest first, grouped by day, with each run of follows as one row. A row on screen
 * for a moment is read, but keeps its dot until the next visit so the list doesn't change under
 * the reader. Results rows stay until opened, so a sealed promise is never lost in the list.
 */
export function NotificationList({
	initialPage,
	initialCategory = 'all',
	viewerUsername,
}: {
	/** Null when the feed couldn't be loaded. */
	initialPage: CursorPage<Notification> | null;
	/** The tab the server page was loaded for (`?tab=`). */
	initialCategory?: NotificationCategory | 'all';
	viewerUsername: string;
}) {
	const { t } = useLanguage();
	const { count: unreadCount } = useUnreadCount();
	// A tab's reset brings its own fetcher so cursors stay with one category
	const fetchPage = useCallback(
		(cursor: string) => getNotifications(cursor, initialCategory === 'all' ? undefined : initialCategory),
		[initialCategory]
	);
	const list = useCursorList(initialPage, fetchPage);
	const [category, setCategory] = useState(initialCategory);
	// A fresh server page replaces the list, so the tab goes back to the page's
	const [seed, setSeed] = useState(initialPage);
	if (initialPage !== seed) {
		setSeed(initialPage);
		setCategory(initialCategory);
	}
	const [isSwitching, setIsSwitching] = useState(false);
	// Days follow the reader's clock, so the grouping waits for hydration
	const isHydrated = useHydrated();

	// Read this visit by being seen: their dots stay until the next one
	const [seenIds, setSeenIds] = useState<ReadonlySet<string>>(new Set());

	const setRead = (ids: Set<string>) =>
		list.setItems((items) => items.map((item) => (ids.has(item.id) ? { ...item, read: true } : item)));
	const markRead = useMarkRead();

	const unreadIds = (entry: Entry) =>
		entryItems(entry)
			.filter((item) => !item.read)
			.map((item) => item.id);

	// The dot clears at once; a failed request leaves it unread on the server, so the next visit shows it again
	const open = (entry: Entry) => {
		const ids = unreadIds(entry);
		if (ids.length === 0) return;
		setRead(new Set(ids));
		markRead.read(ids);
	};

	const seen = (entry: Entry) => {
		const ids = unreadIds(entry);
		setSeenIds((current) => new Set([...current, ...ids]));
		markRead.queue(ids);
	};
	const watchesSeen = (entry: Entry) => entry.kind !== 'RESULT' && unreadIds(entry).some((id) => !seenIds.has(id));

	const changeCategory = async (next: NotificationCategory | 'all') => {
		// A Load more in flight would append the old tab's page after the reset
		if (next === category || isSwitching || list.isLoading) return;
		setIsSwitching(true);
		try {
			const nextCategory = next === 'all' ? undefined : next;
			list.reset(await getNotifications(null, nextCategory), (cursor) => getNotifications(cursor, nextCategory));
			setCategory(next);
			window.history.replaceState(null, '', nextCategory ? `?tab=${nextCategory.toLowerCase()}` : window.location.pathname);
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
	const isEmpty = list.items.length === 0 && !list.hasMore && unreadCount === 0 && category === 'all';

	const groups = (['today', 'yesterday', 'earlier'] as const)
		.map((group) => ({
			group,
			entries: groupFollows(list.items.filter((item) => isHydrated && dayGroup(item.createdAt) === group)),
		}))
		.filter((group) => group.entries.length > 0);
	const rows = (entries: Entry[]) => (
		<ul className="flex flex-col gap-2">
			{entries.map((entry) => (
				<NotificationRow
					key={entry.id}
					entry={entry}
					onOpen={() => open(entry)}
					onSeen={watchesSeen(entry) ? () => seen(entry) : undefined}
					viewerUsername={viewerUsername}
				/>
			))}
		</ul>
	);

	return (
		<>
			<NotificationsHeader />
			<div className="flex flex-col gap-4">
				<FilterPills
					label={t('notifications.categoryLabel')}
					value={category}
					onChange={changeCategory}
					options={[
						{ value: 'all', label: t('profile.filterAll') },
						...NOTIFICATION_CATEGORIES.map((value) => ({ value, label: t(`notifications.category.${value}`) })),
					]}
				/>

				{isEmpty ? (
					<EmptyCard title={t('notifications.empty')} body={t('notifications.emptyHint')} />
				) : (
					list.items.length === 0 && <p className="empty-state">{t('notifications.categoryEmpty')}</p>
				)}
				{!isHydrated && rows(groupFollows(list.items))}
				{groups.map(({ group, entries }) => (
					<section key={group} aria-labelledby={`day-${group}`} className="flex flex-col gap-2">
						<h2 id={`day-${group}`} className="mx-0.5 text-caption-2 font-medium text-muted-foreground">
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
				<span className="text-body-4 font-medium">{t('notifications.settingsTitle')}</span>
				{preferences && <span className="text-caption-2 text-muted-foreground">{preferencesSummary(preferences, t)}</span>}
			</span>
			<ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
		</Link>
	);
}
