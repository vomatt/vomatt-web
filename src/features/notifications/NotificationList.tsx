'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { FilterPills } from '@/components/FilterPills';
import { LoadMore } from '@/components/LoadMore';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Ban, Bell, Clock, MessageSquare } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BallotOutcome } from '@/features/account/insights';
import { FollowButton } from '@/features/follows/FollowButton';
import { isDecided, OutcomeChip } from '@/features/polls/components/OutcomeChip';
import { SealMark } from '@/features/polls/components/Seal';
import { formatFromNow, formatPollDate } from '@/features/polls/format';
import { ProfileAvatar } from '@/features/profiles/UserChip';
import { useCursorList } from '@/hooks/useCursorList';
import { useHydrated } from '@/hooks/useHydrated';
import type { CursorPage } from '@/lib/api/cursor';
import { toPayloadLocale } from '@/lib/locale';
import { rich, richList } from '@/lib/rich';
import { profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

import type { Notification, NotificationPoll } from './schema';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from './service';
import { useUnreadCount } from './UnreadCountProvider';
import { UnreadDot } from './UnreadDot';

const fetchPage = async (cursor: string) => {
	const result = await getNotifications(cursor);
	if (!result.ok) throw new Error(result.message);
	return result.data;
};

export type DayGroup = 'today' | 'yesterday' | 'earlier';

/** Which day a moment falls on, in the reader's own calendar. */
export function dayGroup(iso: string, now = new Date()): DayGroup {
	const day = new Date(iso);
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	if (day.getTime() >= startOfToday) return 'today';
	if (day.getTime() >= startOfToday - 86_400_000) return 'yesterday';
	return 'earlier';
}

/** One row: a notification, or the follows of one day folded into "@a and 3 others followed you". */
type Row = { key: string; items: Notification[] };

export function toRows(items: Notification[]): Row[] {
	const rows: Row[] = [];
	let follows: Row | null = null;
	for (const item of items) {
		if (item.kind !== 'FOLLOWED' || !item.actor) {
			rows.push({ key: item.id, items: [item] });
		} else if (follows) {
			follows.items.push(item);
		} else {
			follows = { key: item.id, items: [item] };
			rows.push(follows);
		}
	}
	return rows;
}

/** How the viewer's Ballot fared, once the Poll has Ended and named its winners. */
export function pollOutcome(poll: NotificationPoll): BallotOutcome {
	if (poll.status !== 'ENDED' || !poll.myOptionId || !poll.winningOptionIds?.length) return 'unknown';
	if (!poll.winningOptionIds.includes(poll.myOptionId)) return 'lost';
	return poll.tie ? 'tied' : 'won';
}

/** The page's title and intro; rendered outside the list's Suspense boundary. */
export function NotificationsHeader() {
	const { t } = useLanguage();
	return (
		<div>
			<h1 className="display-heading text-[30px] text-foreground md:text-[40px]">{t('notifications.title')}</h1>
			<p className="mt-1.5 text-[14px] text-muted-foreground">{t('notifications.intro')}</p>
		</div>
	);
}

/**
 * The notification feed, newest first, grouped by day. Results rows stay
 * until opened, so a sealed promise is never lost in the list.
 */
export function NotificationList({
	initialPage,
}: {
	/** The feed's first page; null when it couldn't be loaded. */
	initialPage: CursorPage<Notification> | null;
}) {
	const { t } = useLanguage();
	const { refresh } = useUnreadCount();
	const list = useCursorList(initialPage, fetchPage);
	const [filter, setFilter] = useState<'all' | 'unread'>('all');
	const [isMarking, setIsMarking] = useState(false);
	// Days follow the reader's clock, so the grouping waits for hydration
	const isHydrated = useHydrated();

	const unread = list.items.filter((item) => !item.read);
	const shown = filter === 'unread' ? unread : list.items;

	const clear = (ids: Set<string>) =>
		list.setItems((items) => items.map((item) => (ids.has(item.id) ? { ...item, read: true } : item)));

	// Opening a row reads it: clear the dot at once, tell the API in the background
	const open = (ids: string[]) => {
		const pending = ids.filter((id) => unread.some((item) => item.id === id));
		if (pending.length === 0) return;
		clear(new Set(pending));
		Promise.all(pending.map((id) => markNotificationRead(id).catch(() => false))).then((results) => {
			// Put back the dot of any row the API didn't mark, so the list agrees with the badge
			const failed = new Set(pending.filter((_, i) => results[i] === false));
			if (failed.size > 0) {
				list.setItems((items) => items.map((item) => (failed.has(item.id) ? { ...item, read: false } : item)));
			}
			refresh();
		});
	};

	const markAllRead = async () => {
		setIsMarking(true);
		const result = await markAllNotificationsRead().catch(() => null);
		setIsMarking(false);
		if (!result?.ok) {
			toast.error(t('notifications.markAllFailed'));
			return;
		}
		clear(new Set(list.items.map((item) => item.id)));
		refresh();
	};

	if (initialPage === null) {
		return <p className="py-16 text-center text-muted-foreground">{t('notifications.loadFailed')}</p>;
	}
	if (list.items.length === 0) {
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
		.map((group) => ({
			group,
			rows: toRows(shown.filter((item) => isHydrated && dayGroup(item.createdAt) === group)),
		}))
		.filter((group) => group.rows.length > 0);

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
					{toRows(shown).map((row) => (
						<NotificationRow key={row.key} row={row} onOpen={open} />
					))}
				</ul>
			)}
			{groups.map(({ group, rows }) => (
				<section key={group} aria-labelledby={`day-${group}`} className="flex flex-col gap-2">
					<h2 id={`day-${group}`} className="mx-0.5 text-[12px] font-medium text-muted-foreground">
						{t(`notifications.day.${group}`)}
					</h2>
					<ul className="flex flex-col gap-2">
						{rows.map((row) => (
							<NotificationRow key={row.key} row={row} onOpen={open} />
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

/** Where a notification leads: its Poll (for a Comment, to the Comment), or the follower's profile. */
function notificationHref(item: Notification) {
	if (!item.poll) return item.actor ? profileHref(item.actor.username) : '/';
	const hash = item.comment
		? `#comment-${item.comment.parentId ? `${item.comment.parentId}/${item.comment.id}` : item.comment.id}`
		: '';
	return `/poll/${item.poll.id}${hash}`;
}

/** One notification: unread rows are a card with a dot; read ones sit flat until hovered. */
function NotificationRow({ row, onOpen }: { row: Row; onOpen: (ids: string[]) => void }) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [item] = row.items;
	const { actor, poll, comment } = item;
	const ids = row.items.map((entry) => entry.id);
	const isUnread = row.items.some((entry) => !entry.read);
	const href = notificationHref(item);
	const ago = isHydrated ? formatFromNow(item.createdAt, currentLanguage) : null;
	const isResult = item.kind === 'RESULT';
	const strong = (text: string) => <strong className="font-semibold">{text}</strong>;
	const name = actor ? `@${actor.username}` : '';
	const title = <span className="font-medium">{poll?.title}</span>;
	const open = () => onOpen(ids);
	const pollLink = (
		<Link href={href} onClick={open} className={rowLink}>
			{title}
		</Link>
	);
	// The dot trails the first line, as it trails a tab's label, so read and unread rows share one left edge.
	// The word joiner keeps it on the line of the last word instead of wrapping alone to the left edge.
	const lineDot = isUnread && (
		<>
			{'⁠'}
			<UnreadDot label={t('notifications.unread')} className="ml-2 align-middle" />
		</>
	);
	const meta = (...parts: React.ReactNode[]) => (
		<span className={cn('text-[12px] text-muted-foreground', isResult && isUnread && 'text-tide-foreground')}>
			{parts.filter(Boolean).map((part, i) => (
				<span key={i}>
					{i > 0 && ' · '}
					{part}
				</span>
			))}
		</span>
	);
	const avatar = actor && <ProfileAvatar username={actor.username} avatarUrl={actor.avatarUrl} className="size-9" />;
	const iconBadge = (icon: React.ReactNode) => (
		<span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">{icon}</span>
	);
	const voteButton = poll && (
		<Link
			href={href}
			onClick={open}
			className={buttonVariants({ size: 'sm', variant: poll.myOptionId || poll.status === 'SCHEDULED' ? 'outline' : 'default' })}
		>
			{t(poll.myOptionId || poll.status === 'SCHEDULED' ? 'notifications.view' : 'poll.vote')}
		</Link>
	);

	let icon: React.ReactNode = avatar;
	let text: React.ReactNode = null;
	let aside: React.ReactNode = null;

	switch (item.kind) {
		case 'INVITATION':
			text = (
				<>
					<span className="text-[15px] leading-snug">
						{rich(t('notifications.invitedYou'), { name: strong(name) })} · {pollLink}
						{lineDot}
					</span>
					{meta(
						t('notifications.inviteOnly'),
						isHydrated &&
							poll &&
							(poll.status === 'SCHEDULED'
								? t('poll.chipOpens', { date: formatPollDate(poll.startTime, currentLanguage) })
								: t('profile.endsAt', { date: formatPollDate(poll.endTime, currentLanguage) })),
						ago
					)}
				</>
			);
			aside = voteButton;
			break;
		case 'CANCELLED':
			icon = iconBadge(<Ban aria-hidden className="size-4" />);
			text = (
				<>
					<span className="text-[15px] leading-snug text-muted-foreground">
						{rich(t(actor ? 'notifications.cancelledBy' : 'notifications.cancelledPoll'), {
							title: (
								<Link href={href} onClick={open} className={cn(rowLink, 'text-foreground')}>
									{title}
								</Link>
							),
							name,
						})}
						{lineDot}
					</span>
					{meta(poll?.myOptionId && t('notifications.neverCounted'), ago)}
				</>
			);
			break;
		case 'RESULT': {
			const outcome = poll ? pollOutcome(poll) : 'unknown';
			const winners = poll?.winningOptionLabels ?? [];
			const decided = (text: string) => <strong className="font-medium text-foreground">{text}</strong>;
			icon = <SealMark />;
			text = (
				<>
					<span className="text-[15px] leading-snug">
						{isUnread ? strong(t('notifications.ended')) : t('notifications.ended')} ·{' '}
						<Link href={href} onClick={open} className={rowLink}>
							{poll?.title}
						</Link>
						{lineDot}
					</span>
					{meta(
						winners.length === 1 && rich(t('profile.wonBy'), { option: decided(winners[0]) }),
						winners.length > 1 &&
							rich(t('profile.tieBetween'), { options: richList(winners, toPayloadLocale(currentLanguage), decided) }),
						poll && (
							<span className="font-mono tabular-nums">
								{t('poll.voted', { count: poll.turnout.toLocaleString(toPayloadLocale(currentLanguage)) })}
							</span>
						),
						ago
					)}
				</>
			);
			aside = isDecided(outcome) && <OutcomeChip outcome={outcome} />;
			break;
		}
		case 'FOLLOWED': {
			const others = row.items.length - 1;
			const who = (entry: Notification) =>
				entry.actor && (
					<Link href={profileHref(entry.actor.username)} onClick={open} className={cn(rowLink, 'font-semibold')}>
						@{entry.actor.username}
					</Link>
				);
			text = (
				<>
					<span className="text-[15px] leading-snug">
						{others === 0
							? rich(t('notifications.followedYou'), { name: who(item) })
							: rich(t(others === 1 ? 'notifications.followedYouOthers_one' : 'notifications.followedYouOthers'), {
									name: who(item),
									count: others.toLocaleString(toPayloadLocale(currentLanguage)),
								})}
						{lineDot}
					</span>
					{meta(ago)}
				</>
			);
			aside = others === 0 && actor && <FollowButton userId={actor.id} initialFollowing={actor.isFollowing} />;
			break;
		}
		case 'COMMENT':
			text = (
				<>
					<span className="text-[15px] leading-snug">
						{rich(t(comment?.parentId ? 'notifications.repliedOn' : 'notifications.commentedOn'), {
							name: strong(name),
							title: pollLink,
						})}
						{lineDot}
					</span>
					{meta(comment && <span className="line-clamp-1">“{comment.excerpt}”</span>, ago)}
				</>
			);
			icon = (
				<span className="relative shrink-0">
					{avatar}
					<MessageSquare
						aria-hidden
						className="absolute -right-1 -bottom-1 size-4 rounded-full bg-background p-0.5 text-muted-foreground"
					/>
				</span>
			);
			break;
		case 'CLOSING_SOON':
			icon = iconBadge(<Clock aria-hidden className="size-4" />);
			text = (
				<>
					<span className="text-[15px] leading-snug">
						{rich(t('notifications.closingSoon'), { title: pollLink })}
						{lineDot}
					</span>
					{meta(
						isHydrated && poll && t('profile.endsAt', { date: formatPollDate(poll.endTime, currentLanguage) }),
						actor && name
					)}
				</>
			);
			aside = voteButton;
			break;
	}

	return (
		<li
			className={cn(
				'flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-colors',
				isUnread
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
