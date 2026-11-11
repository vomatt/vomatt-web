'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { EmptyCard } from '@/components/EmptyCard';
import { FilterPills } from '@/components/FilterPills';
import { LoadMore } from '@/components/LoadMore';
import { StickyBar } from '@/components/StickyBar';
import { ChevronRight } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActing } from '@/features/communities/ActingProvider';
import { PollRowListSkeleton } from '@/features/polls/components/PollCardSkeleton';
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
import { getNotifications, markAllNotificationsRead } from './service';
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

/** The page's title. */
export function NotificationsHeader() {
	const { t } = useLanguage();
	return <h1 className="text-title-1 text-foreground">{t('notifications.title')}</h1>;
}

/** The title over placeholder rows, while the list loads. */
export function NotificationsSkeleton() {
	return (
		<>
			<NotificationsHeader />
			<PollRowListSkeleton chip={false} />
		</>
	);
}

/**
 * The feed, newest first, grouped by day, with each run of follows as one row. Opening the page
 * reads every notification. What was unread then keeps its dot until opened, including on pages fetched
 * after that (Load more, another tab), so the list shows what is new without changing under the reader.
 */
export function NotificationList({
	initialPage,
	initialCategory = 'all',
	unreadIds,
	viewerUsername,
}: {
	/** Null when the feed couldn't be loaded. */
	initialPage: CursorPage<Notification> | null;
	/** The tab the server page was loaded for (`?tab=`). */
	initialCategory?: NotificationCategory | 'all';
	/** The feed's unread ids from before this visit read them all; null when they couldn't be loaded. */
	unreadIds: string[] | null;
	viewerUsername: string;
}) {
	const { t } = useLanguage();
	const { count: unreadCount, refresh } = useUnreadCount();
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

	// Read whenever a feed is shown, including one a refresh recovers; a failed request leaves the badge as it was
	const hasFeed = initialPage !== null;
	const locked = !!useActing().acting?.locked;
	useEffect(() => {
		if (!hasFeed || locked) return;
		markAllNotificationsRead().then(
			(result) => result.ok && refresh(),
			(error) => console.error('Marking notifications read failed:', error)
		);
	}, [hasFeed, locked, refresh]);

	// Kept from the first render: pages fetched after read-all come back read, and a refreshed server page lists none
	const [wasUnread, setWasUnread] = useState<ReadonlySet<string>>(() => new Set(unreadIds));
	const items = list.items.map((item) => (item.read && wasUnread.has(item.id) ? { ...item, read: false } : item));

	// Already read on the server: opening a row only clears its dot
	const open = (entry: Entry) => {
		const opened = entryItems(entry);
		if (opened.every((item) => item.read)) return;
		const ids = new Set(opened.map((item) => item.id));
		setWasUnread((current) => new Set([...current].filter((id) => !ids.has(id))));
		list.setItems((items) => items.map((item) => (ids.has(item.id) ? { ...item, read: true } : item)));
	};

	const changeCategory = async (next: NotificationCategory | 'all') => {
		// A Load more in flight would append the old tab's page after the reset
		if (next === category || isSwitching || list.isLoading) return;
		setIsSwitching(true);
		// Taken before the fetch: a notification opened meanwhile has left this page, and the tab isn't the poll's
		const url = new URL(window.location.href);
		try {
			const nextCategory = next === 'all' ? undefined : next;
			list.reset(await getNotifications(null, nextCategory), (cursor) => getNotifications(cursor, nextCategory));
			setCategory(next);
			if (window.location.pathname !== url.pathname) return;
			if (nextCategory) url.searchParams.set('tab', nextCategory.toLowerCase());
			else url.searchParams.delete('tab');
			window.history.replaceState(null, '', url);
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
			entries: groupFollows(items.filter((item) => isHydrated && dayGroup(item.createdAt) === group)),
		}))
		.filter((group) => group.entries.length > 0);
	const rows = (entries: Entry[]) => (
		<ul className="flex flex-col gap-2">
			{entries.map((entry) => (
				<NotificationRow
					key={entry.id}
					entry={entry}
					onOpen={() => open(entry)}
					viewerUsername={viewerUsername}
				/>
			))}
		</ul>
	);

	return (
		<>
			<NotificationsHeader />
			<div className="flex flex-col gap-4">
				{/* One row on a phone, so the stuck bar stays one row tall; wider columns can be narrow beside the sidebar, so the pills wrap there */}
				<StickyBar data-sticky-bar="pills" className="-mx-1 -my-2 max-md:mx-0">
					<FilterPills
						label={t('notifications.categoryLabel')}
						value={category}
						onChange={changeCategory}
						options={[
							{ value: 'all', label: t('profile.filterAll') },
							...NOTIFICATION_CATEGORIES.map((value) => ({ value, label: t(`notifications.category.${value}`) })),
						]}
						className="px-1 py-2 max-md:flex-nowrap max-md:overflow-x-auto max-md:scrollbar-none max-md:bleed-x"
					/>
				</StickyBar>

				{isEmpty ? (
					<EmptyCard title={t('notifications.empty')} body={t('notifications.emptyHint')} />
				) : (
					list.items.length === 0 && <p className="empty-state">{t('notifications.categoryEmpty')}</p>
				)}
				{!isHydrated && rows(groupFollows(items))}
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
