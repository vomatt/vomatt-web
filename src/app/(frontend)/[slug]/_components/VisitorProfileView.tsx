'use client';

import { Menu } from '@base-ui/react/menu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { FilterPills } from '@/components/FilterPills';
import { PageShell } from '@/components/layout/PageShell';
import { Button, buttonVariants } from '@/components/ui/Button';
import { ArrowLeft, Ban, Ellipsis, Lock } from '@/components/ui/SvgIcons';
import { TidePanel } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { BlockUserDialog } from '@/features/blocks/BlockUserDialog';
import { unblockUser } from '@/features/blocks/service';
import { type Follow, FollowButton, useFollow } from '@/features/follows/FollowButton';
import { type FollowList, FollowListDialog } from '@/features/follows/FollowListDialog';
import type { Poll } from '@/features/polls/schema';
import { getUserPolls } from '@/features/polls/service';
import { splitAsked } from '@/features/profiles/lists';
import { MutualFollowersLine } from '@/features/profiles/MutualFollowers';
import { forgetProfile, rememberFollowing } from '@/features/profiles/ProfileHoverCard';
import { AskedRow, ProfileSection } from '@/features/profiles/ProfileRows';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { toPayloadLocale } from '@/lib/locale';
import { profileHref } from '@/lib/routes';
import type { UserProfile } from '@/types/user';

import { MutualFollowersCard } from './MutualFollowersCard';
import ProfileHeader from './ProfileHeader';
import { ProfileRecord } from './ProfileRecord';
import { ShowMore } from './ShowMore';

type Filter = 'all' | 'open' | 'ended';

/**
 * Someone's public profile: who they are, their public record and the polls
 * they asked. Follow sits where Edit profile sits on your own page. The owner
 * can preview it (`preview`), without the controls a visitor gets.
 */
export function VisitorProfileView({
	profile,
	polls,
	viewerId,
	preview = false,
}: {
	profile: UserProfile;
	/** Null when the polls couldn't load */
	polls: CursorPage<Poll> | null;
	/** The signed-in viewer; null when signed out. */
	viewerId: string | null;
	/** The owner looking at what everyone sees. */
	preview?: boolean;
}) {
	const { t } = useLanguage();
	const [list, setList] = useState<FollowList | null>(null);
	const canAct = !!viewerId && !preview;
	const follow = useFollow(profile.id, profile, {
		isSelf: profile.id === viewerId,
		onChange: (following) => rememberFollowing(profile.username, following),
	});
	const followersCount = profile.followersCount + follow.delta;

	return (
		<PageShell
			rail={
				// What following does, for every visitor: signed out too, before they can follow
				!preview && (
					<aside className="flex flex-col gap-3 xl:sticky xl:top-8">
						<TidePanel className="p-3.5 text-caption-1 leading-relaxed">
							<p className="mb-1 flex items-center gap-1.5 font-medium">
								<Lock aria-hidden className="size-3.5 shrink-0 text-tide" />
								{t('profile.followingNoteTitle')}
							</p>
							<p>{t('profile.followingNoteBody')}</p>
						</TidePanel>
						{canAct && (
							<MutualFollowersCard
								profile={{ ...profile, followersCount }}
								onOpenFollowers={() => setList('followers')}
							/>
						)}
					</aside>
				)
			}
		>
			<div className="flex flex-col gap-6">
				{preview && (
					<TidePanel className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-caption-1">
						<p>{t('profile.previewNote')}</p>
						<Link
							href={profileHref(profile.username)}
							className={buttonVariants({ variant: 'outline', size: 'sm' })}
						>
							<ArrowLeft aria-hidden />
							{t('profile.previewBack')}
						</Link>
					</TidePanel>
				)}
				<ProfileHeader
					profile={{ ...profile, followersCount }}
					onOpenList={viewerId ? setList : undefined}
					actions={canAct && <VisitorActions profile={profile} follow={follow} />}
					mutuals={canAct && <MutualFollowersLine profile={profile} onOpen={() => setList('mutuals')} />}
				/>
				{viewerId && (
					<FollowListDialog
						username={profile.username}
						list={list}
						onOpenChange={(open) => !open && setList(null)}
						viewerId={viewerId}
					/>
				)}
				<ProfileRecord
					cells={[
						{ label: t('profile.recordAsked'), value: profile.totalPolls },
						{ label: t('profile.recordVoted'), value: profile.totalVotes },
					]}
				/>
				<AskedList username={profile.username} total={profile.totalPolls} initialPage={polls} />
			</div>
		</PageShell>
	);
}

/** Follow (or Blocked) and the ••• menu with Block or Unblock. */
function VisitorActions({ profile, follow }: { profile: UserProfile; follow: Follow }) {
	const { t } = useLanguage();
	const router = useRouter();
	const [blockOpen, setBlockOpen] = useState(false);
	const [isUnblocking, setIsUnblocking] = useState(false);

	const unblock = async () => {
		setIsUnblocking(true);
		const result = await settle(unblockUser(profile.id)).finally(() => setIsUnblocking(false));
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'blocks.unblockFailed'));
			return;
		}
		toast.success(t('blocks.unblocked', { username: profile.username }));
		forgetProfile(profile.username);
		router.refresh();
	};

	return (
		<>
			<FollowButton follow={follow} username={profile.username} avatarUrl={profile.avatarUrl} />
			<Menu.Root>
				<Menu.Trigger
					render={<Button variant="outline" size="icon-sm" />}
					aria-label={t('profile.moreFor', { username: profile.username })}
				>
					<Ellipsis aria-hidden />
				</Menu.Trigger>
				<Menu.Portal>
					<Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
						<Menu.Popup className="min-w-44 rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none">
							<Menu.Item
								disabled={isUnblocking}
								onClick={profile.isBlocked ? unblock : () => setBlockOpen(true)}
								className="flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 text-caption-1 font-medium text-destructive outline-none data-highlighted:bg-foreground/5"
							>
								<Ban aria-hidden className="size-4" />
								{profile.isBlocked ? t('blocks.unblock') : t('blocks.blockEllipsis')}
							</Menu.Item>
						</Menu.Popup>
					</Menu.Positioner>
				</Menu.Portal>
			</Menu.Root>
			<BlockUserDialog
				userId={profile.id}
				username={profile.username}
				open={blockOpen}
				onOpenChange={setBlockOpen}
				onBlocked={() => router.refresh()}
			/>
		</>
	);
}

/** Their polls, Open (and opening soon) first, then Ended; filtered over the pages loaded so far. */
function AskedList({
	username,
	total,
	initialPage,
}: {
	username: string;
	/** Every poll they asked, from the profile; the list itself may hold only the first page. */
	total: number;
	initialPage: CursorPage<Poll> | null;
}) {
	const { t, currentLanguage } = useLanguage();
	const router = useRouter();
	const [isRetrying, startRetry] = useTransition();
	const [filter, setFilter] = useState<Filter>('all');
	const fetchPage = useCallback((cursor: string) => getUserPolls(username, cursor), [username]);
	const list = useCursorList(initialPage, fetchPage);
	const { open, ended } = splitAsked(list.items);
	// Counts are exact only once every page is in
	const count = (polls: Poll[]) => (list.hasMore ? undefined : polls.length);

	return (
		<section className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center gap-x-4 border-b border-border">
				<h2 className="relative inline-flex h-11 items-center gap-1.5 text-body-3 font-medium after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-foreground">
					{t('profile.tabAsked')}
					<span className="tabular-nums text-muted-foreground">
						{total.toLocaleString(toPayloadLocale(currentLanguage))}
					</span>
				</h2>
				<FilterPills
					label={t('profile.filterLabel')}
					className="ml-auto py-2"
					value={filter}
					onChange={setFilter}
					options={[
						{ value: 'all', label: t('profile.filterAll') },
						{ value: 'open', label: t('profile.filterOpen') },
						{ value: 'ended', label: t('myPolls.tabEnded') },
					]}
				/>
			</div>

			{!initialPage ? (
				<div className="empty-state space-y-3">
					<p>{t('profile.pollsLoadFailed')}</p>
					<Button variant="outline" size="sm" loading={isRetrying} onClick={() => startRetry(() => router.refresh())}>
						{t('common.tryAgain')}
					</Button>
				</div>
			) : list.items.length === 0 ? (
				<p className="empty-state">{t('profile.noPollsYet')}</p>
			) : (
				<>
					{filter !== 'ended' && open.length > 0 && (
						<>
							<ProfileSection label={t('profile.sectionOpen')} count={count(open)} />
							<ul className="space-y-2">
								{open.map((poll) => (
									<AskedRow key={poll.id} poll={poll} />
								))}
							</ul>
						</>
					)}
					{filter !== 'open' && ended.length > 0 && (
						<>
							<ProfileSection label={t('myPolls.tabEnded')} count={count(ended)} />
							<ul className="space-y-2">
								{ended.map((poll) => (
									<AskedRow key={poll.id} poll={poll} />
								))}
							</ul>
						</>
					)}
					{((filter === 'open' && open.length === 0) || (filter === 'ended' && ended.length === 0)) && !list.hasMore && (
						<p className="empty-state">{t('myPolls.empty')}</p>
					)}
					<ShowMore
						paged={{ hasMore: list.hasMore, more: list.loadMore, isLoading: list.isLoading, loadFailed: list.loadFailed }}
					/>
				</>
			)}
		</section>
	);
}
