'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { FilterPills } from '@/components/FilterPills';
import { LoadMore } from '@/components/LoadMore';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Ban, Bell } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { ballotOutcome } from '@/features/account/insights';
import { isDecided, OutcomeChip } from '@/features/polls/components/OutcomeChip';
import { SealMark } from '@/features/polls/components/Seal';
import { NOTIFICATIONS_PAGE_SIZE } from '@/features/polls/constants';
import { formatFromNow, formatPollDate } from '@/features/polls/format';
import type { Poll } from '@/features/polls/schema';
import { getMyPolls } from '@/features/polls/service';
import { derivePollStatus, getTurnout, isCancelled } from '@/features/polls/status';
import { endedSummary } from '@/features/profiles/lists';
import { DecidedText } from '@/features/profiles/ProfileRows';
import { ProfileAvatar } from '@/features/profiles/UserChip';
import { useCursorList } from '@/hooks/useCursorList';
import { useHydrated } from '@/hooks/useHydrated';
import type { CursorPage } from '@/lib/api/cursor';
import { toPayloadLocale } from '@/lib/locale';
import { rich } from '@/lib/rich';
import { cn } from '@/lib/utils';

import { markNotificationsRead } from './service';
import { useUnreadCount } from './UnreadCountProvider';
import { UnreadDot } from './UnreadDot';

const fetchPage = (cursor: string) => getMyPolls('ended', cursor, NOTIFICATIONS_PAGE_SIZE);

const markRead = (polls: Poll[], ids: Set<string>) =>
	polls.map((poll) => (ids.has(poll.id) ? { ...poll, unread: false } : poll));

type Item = { kind: 'invitation' | 'result'; poll: Poll; at: string };
export type DayGroup = 'today' | 'yesterday' | 'earlier';

/** Which day a moment falls on, in the reader's own calendar. */
export function dayGroup(iso: string, now = new Date()): DayGroup {
	const day = new Date(iso);
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	if (day.getTime() >= startOfToday) return 'today';
	if (day.getTime() >= startOfToday - 86_400_000) return 'yesterday';
	return 'earlier';
}

/** The page's title and intro; rendered outside the list's Suspense boundary. */
export function NotificationsHeader() {
	const { t } = useLanguage();
	return (
		<div>
			<h1 className="page-title text-foreground">{t('notifications.title')}</h1>
			<p className="mt-1.5 text-[14px] text-muted-foreground">{t('notifications.intro')}</p>
		</div>
	);
}

/**
 * Invitations and results in one list, newest first, grouped by day. Results
 * rows stay until opened, so a sealed promise is never lost in the list.
 */
export function NotificationList({
	initialPage,
	invitations: initialInvitations,
}: {
	/** Ended Notifications; null when they couldn't be loaded. */
	initialPage: CursorPage<Poll> | null;
	/** Scheduled and Open Invite-only Polls the user is invited to. */
	invitations: Poll[];
}) {
	const { t } = useLanguage();
	const { refresh } = useUnreadCount();
	const list = useCursorList(initialPage, fetchPage);
	const [invitations, setInvitations] = useState(initialInvitations);
	const [filter, setFilter] = useState<'all' | 'unread'>('all');
	const [isMarking, setIsMarking] = useState(false);
	// Days follow the reader's clock, so the grouping waits for hydration
	const isHydrated = useHydrated();

	const items: Item[] = [
		...invitations.map((poll) => ({ kind: 'invitation' as const, poll, at: poll.createdAt })),
		...list.items.map((poll) => ({ kind: 'result' as const, poll, at: poll.endTime ?? poll.startTime })),
	].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
	const unread = items.filter((item) => item.poll.unread);
	const shown = filter === 'unread' ? unread : items;

	const clear = (ids: Set<string>) => {
		list.setItems((polls) => markRead(polls, ids));
		setInvitations((polls) => markRead(polls, ids));
	};

	// The Poll's page marks it read; clear the dot here at once
	const open = (poll: Poll) => poll.unread && clear(new Set([poll.id]));

	const markAllRead = async () => {
		const ids = unread.map((item) => item.poll.id);
		setIsMarking(true);
		const read = await markNotificationsRead(ids).catch(() => [] as string[]);
		setIsMarking(false);
		// Only the ones the server confirmed; the rest keep their dot
		clear(new Set(read));
		refresh();
		if (read.length < ids.length) toast.error(t('notifications.markAllFailed'));
	};

	if (initialPage === null && invitations.length === 0) {
		return <p className="py-16 text-center text-muted-foreground">{t('notifications.loadFailed')}</p>;
	}
	if (items.length === 0) {
		return (
			<div className="empty-state flex flex-col items-start gap-3">
				<span className="grid size-11 place-items-center rounded-full bg-secondary text-foreground">
					<Bell className="size-5" />
				</span>
				<p>{t('notifications.empty')}</p>
			</div>
		);
	}

	const groups = (['today', 'yesterday', 'earlier'] as const)
		.map((group) => ({ group, items: shown.filter((item) => isHydrated && dayGroup(item.at) === group) }))
		.filter((group) => group.items.length > 0);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<FilterPills
					label={t('profile.filterLabel')}
					value={filter}
					onChange={setFilter}
					options={[
						{ value: 'all', label: t('profile.filterAll') },
						{ value: 'unread', label: t('notifications.unread'), count: unread.length },
					]}
				/>
				<Button variant="outline" size="sm" loading={isMarking} disabled={unread.length === 0} onClick={markAllRead}>
					{t('notifications.markAllRead')}
				</Button>
			</div>

			{shown.length === 0 && <p className="empty-state">{t('notifications.caughtUp')}</p>}
			{!isHydrated && (
				<ul className="flex flex-col gap-2">
					{shown.map((item) => (
						<NotificationRow key={item.poll.id} item={item} onOpen={open} />
					))}
				</ul>
			)}
			{groups.map(({ group, items: groupItems }) => (
				<section key={group} aria-labelledby={`day-${group}`} className="flex flex-col gap-2">
					<h2 id={`day-${group}`} className="mx-0.5 text-[12px] font-medium text-muted-foreground">
						{t(`notifications.day.${group}`)}
					</h2>
					<ul className="flex flex-col gap-2">
						{groupItems.map((item) => (
							<NotificationRow key={item.poll.id} item={item} onOpen={open} />
						))}
					</ul>
				</section>
			))}
			<LoadMore list={list} />
		</div>
	);
}

const rowLink =
	'rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

/** One notification: unread rows are a card with a dot; read ones sit flat until hovered. */
function NotificationRow({ item, onOpen }: { item: Item; onOpen: (poll: Poll) => void }) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const { poll } = item;
	const href = `/poll/${poll.id}`;
	const ago = isHydrated ? formatFromNow(item.at, currentLanguage) : null;
	const cancelled = item.kind === 'result' && isCancelled(poll);
	const isResult = item.kind === 'result' && !cancelled;
	const strong = (text: string) => <strong className="font-semibold">{text}</strong>;
	const title = <span className="font-medium">{poll.title}</span>;
	// The dot trails the first line, as it trails a tab's label, so read and unread rows share one left edge.
	// The word joiner keeps it on the line of the last word instead of wrapping alone to the left edge.
	const lineDot = poll.unread && (
		<>
			{'⁠'}
			<UnreadDot label={t('notifications.unread')} className="ml-2 align-middle" />
		</>
	);
	const meta = (...parts: React.ReactNode[]) => (
		<span className={cn('text-[12px] text-muted-foreground', isResult && poll.unread && 'text-tide-foreground')}>
			{parts.filter(Boolean).map((part, i) => (
				<span key={i}>
					{i > 0 && ' · '}
					{part}
				</span>
			))}
		</span>
	);

	let icon: React.ReactNode;
	let text: React.ReactNode;
	let aside: React.ReactNode = null;

	if (item.kind === 'invitation') {
		const status = derivePollStatus(poll);
		icon = <ProfileAvatar username={poll.creatorUsername} avatarUrl={poll.creatorAvatarUrl} className="size-9" />;
		text = (
			<>
				<span className="text-[15px] leading-snug">
					{rich(t('notifications.invitedYou'), { name: strong(`@${poll.creatorUsername}`) })} ·{' '}
					<Link href={href} onClick={() => onOpen(poll)} className={rowLink}>
						{title}
					</Link>
					{lineDot}
				</span>
				{meta(
					t('notifications.inviteOnly'),
					isHydrated &&
						(status === 'scheduled'
							? t('poll.chipOpens', { date: formatPollDate(poll.startTime, currentLanguage) })
							: poll.endTime && t('profile.endsAt', { date: formatPollDate(poll.endTime, currentLanguage) })),
					ago
				)}
			</>
		);
		aside = (
			<Link
				href={href}
				onClick={() => onOpen(poll)}
				className={buttonVariants({ size: 'sm', variant: poll.myOptionId || status === 'scheduled' ? 'outline' : 'default' })}
			>
				{t(poll.myOptionId || status === 'scheduled' ? 'notifications.view' : 'poll.vote')}
			</Link>
		);
	} else if (cancelled) {
		icon = (
			<span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
				<Ban aria-hidden className="size-4" />
			</span>
		);
		text = (
			<>
				<span className="text-[15px] leading-snug text-muted-foreground">
					{rich(t('notifications.cancelledBy'), {
						title: (
							<Link href={href} onClick={() => onOpen(poll)} className={cn(rowLink, 'text-foreground')}>
								{title}
							</Link>
						),
						name: `@${poll.creatorUsername}`,
					})}
					{lineDot}
				</span>
				{meta(poll.myOptionId && t('notifications.neverCounted'), ago)}
			</>
		);
	} else {
		const outcome = poll.myOptionId ? ballotOutcome(poll, poll.myOptionId) : null;
		icon = <SealMark />;
		text = (
			<>
				<span className="text-[15px] leading-snug">
					{poll.unread ? strong(t('notifications.ended')) : t('notifications.ended')} ·{' '}
					<Link href={href} onClick={() => onOpen(poll)} className={rowLink}>
						{poll.title}
					</Link>
					{lineDot}
				</span>
				{meta(
					endedSummary(poll).kind !== 'none' && <DecidedText poll={poll} />,
					<span className="font-mono tabular-nums">
						{t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString(toPayloadLocale(currentLanguage)) })}
					</span>,
					ago
				)}
			</>
		);
		aside = outcome && isDecided(outcome) && <OutcomeChip outcome={outcome} />;
	}

	return (
		<li
			className={cn(
				'flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-colors',
				poll.unread
					? isResult
						? 'border-tide-line bg-tide-tint'
						: 'border-border bg-card hover:border-border-strong'
					: 'border-transparent hover:border-border hover:bg-card'
			)}
		>
			{icon}
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">{text}</span>
			{aside}
		</li>
	);
}
