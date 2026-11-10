'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { EmptyCard } from '@/components/EmptyCard';
import { FilterPills } from '@/components/FilterPills';
import { PageShell } from '@/components/layout/PageShell';
import { Button, buttonVariants } from '@/components/ui/Button';
import { CirclePlus, Lock, Settings, Users } from '@/components/ui/SvgIcons';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TidePanel } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { isFieldPublic, VISIBILITY_FIELDS } from '@/features/account/visibility';
import { useActing } from '@/features/communities/ActingProvider';
import { canEditProfile, communityMembersHref } from '@/features/communities/schema';
import { type FollowList, FollowListDialog } from '@/features/follows/FollowListDialog';
import { formatUnreadCount } from '@/features/notifications/UnreadCountProvider';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';
import { DraftList } from '@/features/polls/components/DraftList';
import { PollRowListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import type { Poll } from '@/features/polls/schema';
import { getBookmarkedPolls } from '@/features/polls/service';
import { askedPolls, picksWonRate, splitAsked, splitVoted, votedPolls, votesReceived } from '@/features/profiles/lists';
import { AskedRow, ProfileSection, VotedRow } from '@/features/profiles/ProfileRows';
import { PublicPreview } from '@/features/profiles/PublicPreview';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';
import type { MyProfile } from '@/types/user';

import EditProfileDialog from './EditProfileDialog';
import ProfileHeader from './ProfileHeader';
import { ProfileRecord } from './ProfileRecord';
import { ShowMore, usePaged } from './ShowMore';

export type ProfileTab = 'asked' | 'voted' | 'saved';
type AskedFilter = 'all' | 'drafts' | 'open' | 'ended';
type VotedFilter = 'all' | 'sealed' | 'decided';

const TAB_NOTES = {
	asked: { title: 'profile.askedNoteTitle', body: 'profile.askedNoteBody' },
	voted: { title: 'profile.votedNoteTitle', body: 'profile.votedNoteBody' },
	saved: { title: 'profile.savedNoteTitle', body: 'profile.savedNoteBody' },
} satisfies Record<ProfileTab, { title: string; body: string }>;

/**
 * The owner's profile: their record, and three lists one at a time. Asked holds
 * their polls (drafts and the ••• controls are theirs alone); Voted holds the
 * polls they voted in and what they chose; Saved holds the polls they bookmarked.
 * Only they ever see Voted and Saved. Beside it, from `xl`, what everyone else sees.
 */
export function OwnProfileView({
	profile,
	polls,
	initialTab = 'asked',
	openEdit = false,
}: {
	profile: MyProfile;
	/** Every Poll in My Polls (asked and voted in); null when it couldn't load. */
	polls: Poll[] | null;
	initialTab?: ProfileTab;
	/** Opens Edit profile on arrival, e.g. from Settings › What others see. */
	openEdit?: boolean;
}) {
	const { t } = useLanguage();
	const { acting } = useActing();
	const router = useRouter();
	const [tab, setTab] = useState<ProfileTab>(initialTab);
	// Saved loads on first open, then stays mounted so its pages survive a look at another tab
	const [savedOpened, setSavedOpened] = useState(initialTab === 'saved');
	const [askedFilter, setAskedFilter] = useState<AskedFilter>('all');
	const [votedFilter, setVotedFilter] = useState<VotedFilter>('all');
	const [list, setList] = useState<FollowList | null>(null);
	// Follows from the lists move the count until a newer profile arrives with the server's own
	const [follows, setFollows] = useState({ on: profile, delta: 0 });
	const followingDelta = follows.on === profile ? follows.delta : 0;

	const asked = polls ? askedPolls(polls, profile.id) : [];
	const voted = polls ? votedPolls(polls, profile.id) : [];
	const askedSplit = splitAsked(asked);
	const votedSplit = splitVoted(voted);
	const askedUnread = askedSplit.ended.some((poll) => poll.unread);
	const votedUnread = votedSplit.decided.filter((poll) => poll.unread).length;

	const visibility = profile.visibilitySettings ?? {};
	// Hidden fields that have a value; the header marks each with the lock
	const hiddenFields = VISIBILITY_FIELDS.filter(
		(field) => !isFieldPublic(visibility, field) && profile[field] != null && profile[field] !== ''
	);

	return (
		<PageShell
			rail={
				<aside className="flex flex-col gap-3 xl:sticky xl:top-8">
					<PublicPreview profile={profile} className="max-xl:hidden" />
					<TidePanel className="p-3.5 text-caption-1 leading-relaxed">
						<p className="mb-1 flex items-center gap-1.5 font-medium">
							<Lock aria-hidden className="size-3.5 shrink-0 text-tide" />
							{t(TAB_NOTES[tab].title)}
						</p>
						<p>{t(TAB_NOTES[tab].body)}</p>
					</TidePanel>
				</aside>
			}
		>
			<div className="flex flex-col gap-6">
				<ProfileHeader
					profile={{ ...profile, followingCount: profile.followingCount + followingDelta }}
					isOwn
					hiddenFields={hiddenFields}
					onOpenList={setList}
					actions={
						acting ? (
							// The community's own page: its profile for owners and admins, and its members
							<>
								{acting.role && canEditProfile(acting.role) && <EditProfileDialog profile={profile} defaultOpen={openEdit} />}
								<Link href={communityMembersHref(acting.communityId)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
									<Users aria-hidden />
									{t('communities.acting.manageMembers')}
								</Link>
							</>
						) : (
							<>
								<EditProfileDialog profile={profile} defaultOpen={openEdit} />
								<Link
									href="/settings"
									aria-label={t('navigation.settings')}
									className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
								>
									<Settings aria-hidden />
								</Link>
							</>
						)
					}
				/>
				<FollowListDialog
					username={profile.username}
					list={list}
					onOpenChange={(open) => !open && setList(null)}
					viewerId={profile.id}
					onFollowChange={(following) =>
						setFollows((current) => ({
							on: profile,
							delta: (current.on === profile ? current.delta : 0) + (following ? 1 : -1),
						}))
					}
				/>

				<ProfileRecord
					cells={[
						// The counts of the tabs' lists, not the public totals, which leave out Scheduled, Unlisted and Invite-only polls
						{ label: t('profile.recordAsked'), value: profile.createdPollCount },
						// Not votedPollCount: it counts Ballots on the owner's own polls, which the Voted tab leaves out
						{ label: t('profile.recordVoted'), value: polls ? voted.length : null },
						{
							label: t('profile.recordVotesReceived'),
							value: polls ? votesReceived(asked) : null,
							private: true,
						},
						{ label: t('profile.recordPicksWon'), value: picksWonRate(voted), suffix: '%', private: true },
					]}
				/>

				<Tabs value={tab} onValueChange={(value) => {
						setTab(value as ProfileTab);
						if (value === 'saved') setSavedOpened(true);
					}} className="gap-2">
					{/* Lists side by side would split attention; tabs keep one at a time */}
					<div className="flex flex-wrap items-center gap-x-4 border-b border-border">
						<TabsList variant="line" fit>
							<TabsTrigger value="asked" marks={askedUnread && <span className="size-2 rounded-full bg-alert" />}>
								{t('profile.tabAsked')}
								<span className="tabular-nums text-muted-foreground">{asked.length}</span>
								{askedUnread && <span className="sr-only">{t('profile.askedUnread')}</span>}
							</TabsTrigger>
							<TabsTrigger
								value="voted"
								marks={
									<>
										<Lock className="size-3 text-muted-foreground" />
										{votedUnread > 0 && (
											<span className="min-w-4.5 rounded-full bg-alert px-1.5 text-center text-caption-4 font-semibold leading-4.5 text-alert-foreground tabular-nums">
												{formatUnreadCount(votedUnread)}
											</span>
										)}
									</>
								}
							>
								{t('profile.tabVoted')}
								<span className="tabular-nums text-muted-foreground">{voted.length}</span>
								<span className="sr-only">
									({t('profile.onlyYou')})
									{votedUnread > 0 && ` ${formatUnreadCount(votedUnread)} ${t('notifications.unread')}`}
								</span>
							</TabsTrigger>
							<TabsTrigger value="saved" marks={<Lock className="size-3 text-muted-foreground" />}>
								{t('profile.tabSaved')}
								<span className="sr-only">({t('profile.onlyYou')})</span>
							</TabsTrigger>
							<TabsIndicator />
						</TabsList>
						<div className="ml-auto py-2">
							{tab === 'saved' ? null : tab === 'asked' ? (
								<FilterPills
									label={t('profile.filterLabel')}
									value={askedFilter}
									onChange={setAskedFilter}
									options={[
										{ value: 'all', label: t('profile.filterAll') },
										{ value: 'drafts', label: t('myPolls.tabDrafts') },
										{ value: 'open', label: t('profile.filterOpen') },
										{ value: 'ended', label: t('myPolls.tabEnded') },
									]}
								/>
							) : (
								<FilterPills
									label={t('profile.filterLabel')}
									value={votedFilter}
									onChange={setVotedFilter}
									options={[
										{ value: 'all', label: t('profile.filterAll') },
										{ value: 'sealed', label: t('profile.filterSealed') },
										{ value: 'decided', label: t('profile.filterDecided') },
									]}
								/>
							)}
						</div>
					</div>

					<TabsContent value="asked" className="flex flex-col gap-2">
						{polls === null ? (
							<LoadFailed />
						) : (
							<AskedList split={askedSplit} filter={askedFilter} onChanged={() => router.refresh()} />
						)}
					</TabsContent>
					<TabsContent value="voted" className="flex flex-col gap-2">
						{polls === null ? <LoadFailed /> : <VotedList split={votedSplit} filter={votedFilter} />}
					</TabsContent>
					<TabsContent value="saved" keepMounted={savedOpened} className="flex flex-col gap-2">
						<SavedList />
					</TabsContent>
				</Tabs>
			</div>
		</PageShell>
	);
}

function AskedList({
	split,
	filter,
	onChanged,
}: {
	split: { open: Poll[]; ended: Poll[] };
	filter: AskedFilter;
	onChanged: () => void;
}) {
	const { t } = useLanguage();
	const shown = filter === 'open' ? split.open : filter === 'ended' ? split.ended : [...split.open, ...split.ended];
	const paged = usePaged(shown, filter);
	const visible = new Set(paged.items);
	const open = split.open.filter((poll) => visible.has(poll));
	const ended = split.ended.filter((poll) => visible.has(poll));
	const emptyPolls = (
		<EmptyCard
			icon={<CirclePlus />}
			title={t('profile.noPollsYet')}
			body={t('profile.noPollsYetOwn')}
			action={
				<CreatePollTrigger>
					<Button>{t('common.createPoll')}</Button>
				</CreatePollTrigger>
			}
		/>
	);

	if (filter === 'drafts') {
		return <DraftList empty={<p className="empty-state">{t('profile.noDrafts')}</p>} />;
	}

	return (
		<>
			{filter === 'all' && (
				<DraftList
					header={(count) => (
						<ProfileSection
							icon={<Lock aria-hidden className="size-3" />}
							label={t('myPolls.tabDrafts')}
							count={count}
							note={t('profile.onlyYouSeeThese')}
						/>
					)}
				/>
			)}
			{shown.length === 0 && (filter === 'all' ? emptyPolls : <p className="empty-state">{t('myPolls.empty')}</p>)}
			{open.length > 0 && (
				<>
					<ProfileSection label={t('profile.sectionOpen')} count={split.open.length} />
					<ul className="space-y-2">
						{open.map((poll) => (
							<AskedRow key={poll.id} poll={poll} isOwn onChanged={onChanged} />
						))}
					</ul>
				</>
			)}
			{ended.length > 0 && (
				<>
					<ProfileSection label={t('myPolls.tabEnded')} count={split.ended.length} />
					<ul className="space-y-2">
						{ended.map((poll) => (
							<AskedRow key={poll.id} poll={poll} isOwn onChanged={onChanged} />
						))}
					</ul>
				</>
			)}
			<ShowMore paged={paged} />
		</>
	);
}

function VotedList({ split, filter }: { split: { sealed: Poll[]; decided: Poll[] }; filter: VotedFilter }) {
	const { t } = useLanguage();
	const shown =
		filter === 'sealed' ? split.sealed : filter === 'decided' ? split.decided : [...split.sealed, ...split.decided];
	const paged = usePaged(shown, filter);
	const visible = new Set(paged.items);
	const sealed = split.sealed.filter((poll) => visible.has(poll));
	const decided = split.decided.filter((poll) => visible.has(poll));

	if (shown.length === 0) {
		return <p className="empty-state">{t(filter === 'all' ? 'profile.noVotesYet' : 'myPolls.empty')}</p>;
	}

	return (
		<>
			{sealed.length > 0 && (
				<>
					<ProfileSection
						icon={<Lock aria-hidden className="size-3 text-tide" />}
						label={t('profile.sectionSealed')}
						count={split.sealed.length}
					/>
					<ul className="space-y-2">
						{sealed.map((poll) => (
							<VotedRow key={poll.id} poll={poll} />
						))}
					</ul>
				</>
			)}
			{decided.length > 0 && (
				<>
					<ProfileSection label={t('profile.filterDecided')} count={split.decided.length} />
					<ul className="space-y-2">
						{decided.map((poll) => (
							<VotedRow key={poll.id} poll={poll} />
						))}
					</ul>
				</>
			)}
			<ShowMore paged={paged} />
		</>
	);
}

const fetchSaved = (cursor: string) => getBookmarkedPolls(cursor);

/** Bookmarked Polls, fetched when the tab first opens: most profile visits never look. */
function SavedList() {
	const { t } = useLanguage();
	const [first, setFirst] = useState<CursorPage<Poll> | 'loading' | 'failed'>('loading');
	const load = () => getBookmarkedPolls().then(setFirst, () => setFirst('failed'));

	useEffect(() => {
		load();
	}, []);

	if (first === 'loading') return <PollRowListSkeleton />;
	if (first === 'failed') {
		return (
			<div className="empty-state space-y-3">
				<p>{t('profile.pollsLoadFailed')}</p>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setFirst('loading');
						load();
					}}
				>
					{t('common.tryAgain')}
				</Button>
			</div>
		);
	}
	return <SavedRows initialPage={first} />;
}

function SavedRows({ initialPage }: { initialPage: CursorPage<Poll> }) {
	const { t } = useLanguage();
	const list = useCursorList(initialPage, fetchSaved);

	if (list.items.length === 0) {
		return (
			<div className="empty-state space-y-3">
				<p>{t('profile.noSavedYet')}</p>
				<Link href="/explore" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
					{t('profile.savedEmptyCta')}
				</Link>
			</div>
		);
	}

	return (
		<>
			<ul className="space-y-2">
				{list.items.map((poll) => (
					<AskedRow key={poll.id} poll={poll} />
				))}
			</ul>
			<ShowMore
				paged={{ hasMore: list.hasMore, more: list.loadMore, isLoading: list.isLoading, loadFailed: list.loadFailed }}
			/>
		</>
	);
}

/** Not an empty list: saying "No polls yet" would be false. The server render fetches them again. */
function LoadFailed() {
	const { t } = useLanguage();
	const router = useRouter();
	const [isRetrying, startRetry] = useTransition();
	return (
		<div className="empty-state space-y-3">
			<p>{t('profile.pollsLoadFailed')}</p>
			<Button variant="outline" size="sm" loading={isRetrying} onClick={() => startRetry(() => router.refresh())}>
				{t('common.tryAgain')}
			</Button>
		</div>
	);
}
