'use client';

import Link from 'next/link';
import { type ComponentType, useEffect, useRef, useState } from 'react';

import { Button, buttonVariants } from '@/components/ui/Button';
import { Ban, Clock } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { FollowButton, useFollow } from '@/features/follows/FollowButton';
import { FollowListDialog } from '@/features/follows/FollowListDialog';
import { type DecidedOutcome, OutcomeChip } from '@/features/polls/components/OutcomeChip';
import { SealMark } from '@/features/polls/components/Seal';
import { formatAge, formatDuration } from '@/features/polls/format';
import { useViewerClock } from '@/features/polls/hooks/useViewerClock';
import { derivePollStatus } from '@/features/polls/status';
import { pollTiming } from '@/features/polls/timing';
import { ProfileHoverCard, rememberFollowing } from '@/features/profiles/ProfileHoverCard';
import { ProfileAvatar } from '@/features/profiles/UserChip';
import { countText } from '@/lib/count';
import { toPayloadLocale } from '@/lib/locale';
import { rich, richList } from '@/lib/rich';
import { commentHash, profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

import type { Notification, PollSummary } from './schema';
import { UnreadDot } from './UnreadDot';

type Followed = Extract<Notification, { kind: 'FOLLOWED' }>;

/** Consecutive follows, shown as one row: "@bkim and 3 others followed you". */
export type FollowGroup = { kind: 'FOLLOWED_GROUP'; id: string; items: Followed[] };

/** What the list shows as one row. */
export type Entry = Notification | FollowGroup;

/** Folds each run of two or more consecutive follows into one group. */
export function groupFollows(items: Notification[]): Entry[] {
	const entries: Entry[] = [];
	let run: Followed[] = [];
	const flush = () => {
		if (run.length > 1) entries.push({ kind: 'FOLLOWED_GROUP', id: run[0].id, items: run });
		else entries.push(...run);
		run = [];
	};
	for (const item of items) {
		if (item.kind === 'FOLLOWED') {
			run.push(item);
			continue;
		}
		flush();
		entries.push(item);
	}
	flush();
	return entries;
}

/** The notifications an entry stands for. */
export const entryItems = (entry: Entry): Notification[] => (entry.kind === 'FOLLOWED_GROUP' ? entry.items : [entry]);

type RowProps<E extends Entry> = {
	entry: E;
	/** Marks the entry read: the person opened it or acted on it. */
	onOpen: () => void;
	/** Called once the row has been on screen long enough to count as read; none when it shouldn't. */
	onSeen?: () => void;
	/** The signed-in viewer, whose followers a group of follows opens. */
	viewerUsername: string;
};

const ROWS: { [K in Entry['kind']]: ComponentType<RowProps<Extract<Entry, { kind: K }>>> } = {
	RESULT: ResultRow,
	CANCELLED: CancelledRow,
	INVITATION: InvitationRow,
	FOLLOWED: FollowedRow,
	FOLLOWED_GROUP: FollowGroupRow,
	COMMENT: CommentRow,
	MENTION: CommentRow,
	CLOSING_SOON: ClosingSoonRow,
	LIKE: CommentRow,
};

export function NotificationRow(props: RowProps<Entry>) {
	const Row = ROWS[props.entry.kind] as ComponentType<RowProps<Entry>>;
	return <Row {...props} />;
}

// Above the row's own link, so each keeps its own target
const rowLink =
	'relative z-10 rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

const strong = (text: string) => <strong className="font-semibold">{text}</strong>;

/** "2h", once the viewer's clock is known. */
function useAge(iso: string) {
	const clock = useViewerClock();
	return clock && formatAge(iso, clock.language, clock.now);
}

/** How long a row stays at least half on screen before it counts as read. */
export const SEEN_MS = 1000;

/** Calls `onSeen` once the element has been at least half on screen, in a visible tab, for `SEEN_MS`. */
function useSeen(onSeen: (() => void) | undefined) {
	const ref = useRef<HTMLLIElement>(null);
	const onSeenRef = useRef(onSeen);
	useEffect(() => {
		onSeenRef.current = onSeen;
	});
	const isWatching = !!onSeen;
	useEffect(() => {
		const element = ref.current;
		if (!isWatching || !element) return;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let isInView = false;
		// The observer reports nothing while the tab is hidden, so the tab's own visibility restarts the wait
		const restart = () => {
			clearTimeout(timer);
			if (!isInView || document.visibilityState !== 'visible') return;
			timer = setTimeout(() => {
				stop();
				onSeenRef.current?.();
			}, SEEN_MS);
		};
		const observer = new IntersectionObserver(
			(entries) => {
				// isIntersecting is true for any overlap; several entries in one call come oldest first
				const entry = entries[entries.length - 1];
				isInView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
				restart();
			},
			{ threshold: 0.5 }
		);
		const stop = () => {
			clearTimeout(timer);
			observer.disconnect();
			document.removeEventListener('visibilitychange', restart);
		};
		observer.observe(element);
		document.addEventListener('visibilitychange', restart);
		return stop;
	}, [isWatching]);
	return ref;
}

/**
 * One notification: unread rows are a card with a dot after the first line, read ones a soft fill
 * that turns into a card when hovered. `tide` is a result's promise kept. The whole row opens `href`, or calls
 * `onOpen` without one; that target is for pointers only, as the row's own links and actions
 * already reach it by keyboard.
 */
function RowShell({
	href,
	onOpen,
	onSeen,
	unread,
	tide = false,
	muted = false,
	icon,
	line,
	meta,
	action,
}: {
	href?: string;
	onOpen: () => void;
	onSeen?: () => void;
	unread: boolean;
	tide?: boolean;
	muted?: boolean;
	icon: React.ReactNode;
	line: React.ReactNode;
	meta: React.ReactNode[];
	action?: React.ReactNode;
}) {
	const { t } = useLanguage();
	const ref = useSeen(onSeen);
	const cover = 'absolute inset-0 rounded-xl';
	// Above the cover, but only its links and buttons take the pointer: the rest still opens the row
	const raised = 'relative z-10 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto';
	return (
		<li
			ref={ref}
			className={cn(
				'relative isolate flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-colors',
				unread
					? tide
						? 'border-tide-line bg-tide-tint'
						: 'border-border bg-card hover:border-border-strong'
					: 'border-transparent bg-surface-soft hover:border-border hover:bg-card'
			)}
		>
			{href ? (
				<Link href={href} onClick={onOpen} aria-hidden tabIndex={-1} className={cover} />
			) : (
				<button
					type="button"
					onClick={onOpen}
					// Never focused, so a dialog it opens doesn't hand focus back to a hidden element
					onMouseDown={(event) => event.preventDefault()}
					aria-hidden
					tabIndex={-1}
					className={cn(cover, 'cursor-pointer')}
				/>
			)}
			<span className={cn(raised, 'shrink-0')}>{icon}</span>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className={cn('text-[15px] leading-snug', muted && 'text-muted-foreground')}>
					{line}
					{/* The word joiner keeps the dot on the line of the last word instead of wrapping alone to the left edge */}
					{unread && (
						<>
							{'⁠'}
							<UnreadDot label={t('notifications.unread')} className="ml-2 align-middle" />
						</>
					)}
				</span>
				<span className={cn('text-[12px] text-muted-foreground', tide && unread && 'text-tide-foreground')}>
					{meta.filter(Boolean).map((part, i) => (
						<span key={i}>
							{i > 0 && ' · '}
							{part}
						</span>
					))}
				</span>
			</span>
			{action && <span className={cn(raised, 'flex shrink-0 items-center')}>{action}</span>}
		</li>
	);
}

function IconDisc({ children }: { children: React.ReactNode }) {
	return (
		<span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
			{children}
		</span>
	);
}

function RowLink({ href, onOpen, className, children }: { href: string; onOpen: () => void; className?: string; children: React.ReactNode }) {
	return (
		<Link href={href} onClick={onOpen} className={cn(rowLink, className)}>
			{children}
		</Link>
	);
}

/** "@jtan" as a profile link with the hover card. */
function ActorName({ username, avatarUrl, onOpen }: { username: string; avatarUrl?: string | null; onOpen: () => void }) {
	return (
		<ProfileHoverCard username={username} avatarUrl={avatarUrl}>
			<Link href={profileHref(username)} onClick={onOpen} className={rowLink}>
				{strong(`@${username}`)}
			</Link>
		</ProfileHoverCard>
	);
}

const pollHref = (pollId: string) => `/poll/${pollId}`;

/** How the viewer's pick fared once the Poll Ended; null without a Ballot to compare. */
function pickOutcome({ myOptionId, winningOptionIds, tie }: PollSummary): DecidedOutcome | null {
	if (!myOptionId || !winningOptionIds) return null;
	if (!winningOptionIds.includes(myOptionId)) return 'lost';
	return tie ? 'tied' : 'won';
}

/** "**Yes** won" or "Tie between **A** and **B**", for an Ended Poll whose Ballots named an option. */
function WinnersText({ poll }: { poll: PollSummary }) {
	const { t, currentLanguage } = useLanguage();
	const labels = poll.winningOptionLabels ?? [];
	const option = (text: string) => <strong className="font-medium text-foreground">{text}</strong>;
	if (!poll.tie) return rich(t('profile.wonBy'), { option: option(labels[0]) });
	return rich(t('profile.tieBetween'), { options: richList(labels, toPayloadLocale(currentLanguage), option) });
}

function ResultRow({ entry, onOpen, onSeen }: RowProps<Extract<Entry, { kind: 'RESULT' }>>) {
	const { t, currentLanguage } = useLanguage();
	const { poll } = entry;
	const unread = !entry.read;
	const outcome = pickOutcome(poll);
	return (
		<RowShell
			href={pollHref(poll.id)}
			onOpen={onOpen}
			onSeen={onSeen}
			unread={unread}
			tide
			icon={<SealMark />}
			line={
				<>
					{unread ? strong(t('notifications.ended')) : t('notifications.ended')} ·{' '}
					<RowLink href={pollHref(poll.id)} onOpen={onOpen}>
						{poll.title}
					</RowLink>
				</>
			}
			meta={[
				!!poll.winningOptionLabels?.length && <WinnersText key="outcome" poll={poll} />,
				<span key="turnout" className="font-mono tabular-nums">
					{t('poll.voted', { count: (poll.turnout ?? 0).toLocaleString(toPayloadLocale(currentLanguage)) })}
				</span>,
				useAge(entry.createdAt),
			]}
			action={outcome && <OutcomeChip outcome={outcome} />}
		/>
	);
}

/** Words only, no action: there is nothing left to do. */
function CancelledRow({ entry, onOpen, onSeen }: RowProps<Extract<Entry, { kind: 'CANCELLED' }>>) {
	const { t } = useLanguage();
	const { poll } = entry;
	return (
		<RowShell
			href={pollHref(poll.id)}
			onOpen={onOpen}
			onSeen={onSeen}
			unread={!entry.read}
			muted
			icon={
				<IconDisc>
					<Ban aria-hidden className="size-4" />
				</IconDisc>
			}
			line={rich(t('notifications.cancelledBy'), {
				title: (
					<RowLink href={pollHref(poll.id)} onOpen={onOpen} className="font-medium text-foreground">
						{poll.title}
					</RowLink>
				),
				name: `@${entry.actor.username}`,
			})}
			meta={[useAge(entry.createdAt)]}
		/>
	);
}

/** The action is the vote; once cast, or before the poll opens, it is View. */
function InvitationRow({ entry, onOpen, onSeen }: RowProps<Extract<Entry, { kind: 'INVITATION' }>>) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	const { poll, actor } = entry;
	const href = pollHref(poll.id);
	const times = { startTime: poll.startTime, endTime: poll.endTime ?? null };
	// The clock moves a Scheduled poll to Open and an Open one to closing; only Ended comes from the API
	const status = clock && derivePollStatus({ ...times, active: poll.status !== 'ENDED', votingActive: true }, clock.now);
	const when = clock && status && pollTiming(times, status, clock).when;
	// The API's status until the clock is known, then the same clock as the timing text
	const isOpen = status ? status === 'open' || status === 'closing' : poll.status === 'OPEN';
	const canVote = !poll.myOptionId && isOpen;
	return (
		<RowShell
			href={href}
			onOpen={onOpen}
			onSeen={onSeen}
			unread={!entry.read}
			icon={<ProfileAvatar username={actor.username} avatarUrl={actor.avatarUrl} className="size-9" />}
			line={
				<>
					{rich(t('notifications.invitedYou'), { name: strong(`@${actor.username}`) })} ·{' '}
					<RowLink href={href} onOpen={onOpen} className="font-medium">
						{poll.title}
					</RowLink>
				</>
			}
			meta={[t('notifications.inviteOnly'), when, useAge(entry.createdAt)]}
			action={
				<Link href={href} onClick={onOpen} className={buttonVariants({ size: 'xs', variant: canVote ? 'default' : 'outline' })}>
					{t(canVote ? 'poll.vote' : 'notifications.view')}
				</Link>
			}
		/>
	);
}

/** Follow back on the row; once following, the button says so. */
function FollowedRow({ entry, onOpen, onSeen }: RowProps<Extract<Entry, { kind: 'FOLLOWED' }>>) {
	const { t } = useLanguage();
	const { actor } = entry;
	const follow = useFollow(actor.id, actor, {
		onChange: (following) => {
			rememberFollowing(actor.username, following);
			onOpen();
		},
	});
	return (
		<RowShell
			href={profileHref(actor.username)}
			onOpen={onOpen}
			onSeen={onSeen}
			unread={!entry.read}
			icon={<ProfileAvatar username={actor.username} avatarUrl={actor.avatarUrl} className="size-9" />}
			line={rich(t('notifications.followedYou'), {
				name: <ActorName username={actor.username} avatarUrl={actor.avatarUrl} onOpen={onOpen} />,
			})}
			meta={[useAge(entry.createdAt), actor.displayName]}
			action={<FollowButton follow={follow} username={actor.username} avatarUrl={actor.avatarUrl} size="xs" />}
		/>
	);
}

/** The newest follower names the group; See followers opens the whole list. */
function FollowGroupRow({ entry, onOpen, onSeen, viewerUsername }: RowProps<FollowGroup>) {
	const { t, currentLanguage } = useLanguage();
	const [open, setOpen] = useState(false);
	const [{ actor, createdAt }] = entry.items;
	const others = entry.items.length - 1;
	const seeFollowers = () => {
		setOpen(true);
		onOpen();
	};
	return (
		<RowShell
			onOpen={seeFollowers}
			onSeen={onSeen}
			unread={entry.items.some((item) => !item.read)}
			icon={<ProfileAvatar username={actor.username} avatarUrl={actor.avatarUrl} className="size-9" />}
			// countText fills in the count and leaves `{name}` for rich to put the link in
			line={rich(countText(t, 'notifications.followedYouGroup', others, currentLanguage), {
				name: <ActorName username={actor.username} avatarUrl={actor.avatarUrl} onOpen={onOpen} />,
			})}
			meta={[useAge(createdAt)]}
			action={
				<>
					<Button variant="outline" size="xs" onClick={seeFollowers}>
						{t('notifications.seeFollowers')}
					</Button>
					<FollowListDialog username={viewerUsername} list={open ? 'followers' : null} onOpenChange={setOpen} />
				</>
			}
		/>
	);
}

const COMMENT_ROW_LINE = {
	COMMENT: 'notifications.commented',
	MENTION: 'notifications.mentioned',
	LIKE: 'notifications.liked',
} as const;

/** A comment on the viewer's poll or reply, a mention of them, or a like of their comment; all open the comment. */
function CommentRow({ entry, onOpen, onSeen }: RowProps<Extract<Entry, { kind: 'COMMENT' | 'MENTION' | 'LIKE' }>>) {
	const { t } = useLanguage();
	const { actor, poll, comment } = entry;
	const href = `${pollHref(poll.id)}${commentHash(comment)}`;
	return (
		<RowShell
			href={href}
			onOpen={onOpen}
			onSeen={onSeen}
			unread={!entry.read}
			icon={<ProfileAvatar username={actor.username} avatarUrl={actor.avatarUrl} className="size-9" />}
			line={rich(t(COMMENT_ROW_LINE[entry.kind]), {
				name: strong(`@${actor.username}`),
				title: (
					<RowLink href={href} onOpen={onOpen} className="font-medium">
						{poll.title}
					</RowLink>
				),
			})}
			meta={[t('notifications.excerpt', { text: comment.excerpt }), useAge(entry.createdAt)]}
			action={
				<Link href={href} onClick={onOpen} className={buttonVariants({ size: 'xs', variant: 'outline' })}>
					{t('comments.reply')}
				</Link>
			}
		/>
	);
}

/** Only while the viewer holds no Ballot, so the turnout is all there is to say: the counts stay sealed. */
function ClosingSoonRow({ entry, onOpen, onSeen }: RowProps<Extract<Entry, { kind: 'CLOSING_SOON' }>>) {
	const { t, currentLanguage } = useLanguage();
	const clock = useViewerClock();
	const { poll } = entry;
	const href = pollHref(poll.id);
	const endsAt = poll.endTime ? Date.parse(poll.endTime) : null;
	// Once it has Ended there is nothing to count down to or vote in
	const hasEnded = !!clock && endsAt !== null && endsAt <= clock.now;
	const title = (
		<RowLink href={href} onOpen={onOpen} className="font-medium">
			{poll.title}
		</RowLink>
	);
	return (
		<RowShell
			href={href}
			onOpen={onOpen}
			onSeen={onSeen}
			unread={!entry.read}
			icon={
				<IconDisc>
					<Clock aria-hidden className="size-4 text-foreground" />
				</IconDisc>
			}
			line={
				clock && endsAt !== null && !hasEnded
					? rich(t('notifications.endsIn'), {
							title,
							duration: formatDuration(endsAt - clock.now, clock.language),
						})
					: title
			}
			meta={[
				t('notifications.notVoted'),
				<span key="turnout" className="font-mono tabular-nums">
					{t('notifications.votedSoFar', { count: (poll.turnout ?? 0).toLocaleString(toPayloadLocale(currentLanguage)) })}
				</span>,
				useAge(entry.createdAt),
			]}
			action={
				!hasEnded && (
					<Link href={href} onClick={onOpen} className={buttonVariants({ size: 'xs', variant: 'outline' })}>
						{t('poll.vote')}
					</Link>
				)
			}
		/>
	);
}
