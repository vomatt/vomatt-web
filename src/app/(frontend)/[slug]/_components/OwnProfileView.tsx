'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { FilterPills } from '@/components/FilterPills';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Lock, Settings } from '@/components/ui/SvgIcons';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TidePanel } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { isFieldPublic, VISIBILITY_FIELDS } from '@/features/account/visibility';
import { type FollowList, FollowListDialog } from '@/features/follows/FollowListDialog';
import { formatUnreadCount } from '@/features/notifications/UnreadCountProvider';
import { UnreadDot } from '@/features/notifications/UnreadDot';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';
import { DraftList } from '@/features/polls/components/DraftList';
import type { Poll } from '@/features/polls/schema';
import { getTurnout } from '@/features/polls/status';
import { askedPolls, picksWonRate, splitAsked, splitVoted, votedPolls } from '@/features/profiles/lists';
import { AskedRow, ProfileSection, VotedRow } from '@/features/profiles/ProfileRows';
import type { MyProfile } from '@/types/user';

import EditProfileDialog from './EditProfileDialog';
import ProfileHeader from './ProfileHeader';
import { ProfileRecord } from './ProfileRecord';
import { PublicPreview } from './PublicPreview';
import { ShowMore, usePaged } from './ShowMore';

export type ProfileTab = 'asked' | 'voted';
type AskedFilter = 'all' | 'drafts' | 'open' | 'ended';
type VotedFilter = 'all' | 'sealed' | 'decided';

/**
 * The owner's profile: their record, and two lists one at a time. Asked holds
 * their polls (drafts and the ••• controls are theirs alone); Voted holds the
 * polls they voted in and what they chose, which only they ever see. Beside it,
 * what everyone else sees.
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
	const router = useRouter();
	const [tab, setTab] = useState<ProfileTab>(initialTab);
	const [askedFilter, setAskedFilter] = useState<AskedFilter>('all');
	const [votedFilter, setVotedFilter] = useState<VotedFilter>('all');
	const [list, setList] = useState<FollowList | null>(null);

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
		<div className="px-contain mx-auto flex max-w-[1080px] flex-col gap-10 py-6 md:py-10 xl:flex-row xl:items-start">
			<main className="flex min-w-0 flex-1 flex-col gap-6 xl:max-w-[720px]">
				<ProfileHeader
					profile={profile}
					isOwn
					hiddenFields={hiddenFields}
					onOpenList={setList}
					actions={
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
					}
				/>
				<FollowListDialog username={profile.username} list={list} onOpenChange={(open) => !open && setList(null)} />

				<ProfileRecord
					cells={[
						{ label: t('profile.recordAsked'), value: profile.totalPolls },
						{ label: t('profile.recordVoted'), value: profile.totalVotes },
						{
							label: t('profile.recordReached'),
							value: polls ? asked.reduce((sum, poll) => sum + (getTurnout(poll) ?? 0), 0) : null,
							private: true,
						},
						{ label: t('profile.recordPicksWon'), value: picksWonRate(voted), suffix: '%', private: true },
					]}
				/>

				<Tabs value={tab} onValueChange={(value) => setTab(value as ProfileTab)} className="gap-2">
					{/* Two lists side by side would split attention; tabs keep one at a time */}
					<div className="sticky follow-header z-10 flex flex-wrap items-center gap-x-4 border-b border-border bg-background">
						<TabsList variant="line" fit>
							<TabsTrigger value="asked">
								{t('profile.tabAsked')}
								<span className="font-mono tabular-nums text-muted-foreground">{asked.length}</span>
								{askedUnread && <UnreadDot label={t('profile.askedUnread')} />}
							</TabsTrigger>
							<TabsTrigger value="voted">
								{t('profile.tabVoted')}
								<span className="font-mono tabular-nums text-muted-foreground">{voted.length}</span>
								<Lock aria-hidden className="size-3 text-muted-foreground" />
								<span className="sr-only">({t('profile.onlyYou')})</span>
								{votedUnread > 0 && (
									<span className="min-w-4.5 rounded-full bg-alert px-1.5 text-center font-mono text-[10px] font-semibold leading-4.5 text-alert-foreground tabular-nums">
										{formatUnreadCount(votedUnread)}
										<span className="sr-only"> {t('notifications.unread')}</span>
									</span>
								)}
							</TabsTrigger>
							<TabsIndicator />
						</TabsList>
						<div className="ml-auto py-2">
							{tab === 'asked' ? (
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
				</Tabs>
			</main>

			<aside className="flex w-full flex-col gap-3 xl:sticky xl:top-8 xl:w-[280px] xl:shrink-0">
				<PublicPreview profile={profile} />
				<TidePanel className="p-3.5 text-[13px] leading-relaxed">
					<p className="mb-1 flex items-center gap-1.5 font-medium">
						<Lock aria-hidden className="size-3.5 shrink-0 text-tide" />
						{t(tab === 'voted' ? 'profile.votedNoteTitle' : 'profile.askedNoteTitle')}
					</p>
					<p>{t(tab === 'voted' ? 'profile.votedNoteBody' : 'profile.askedNoteBody')}</p>
				</TidePanel>
			</aside>
		</div>
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
		<div className="empty-state space-y-3">
			<p>{t('profile.noPollsYetOwn')}</p>
			<CreatePollTrigger>
				<Button size="sm">{t('common.createPoll')}</Button>
			</CreatePollTrigger>
		</div>
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
