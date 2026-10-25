'use client';

import { Menu } from '@base-ui/react/menu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { FilterPills } from '@/components/FilterPills';
import { LoadMore } from '@/components/LoadMore';
import { Button, buttonVariants } from '@/components/ui/Button';
import { ArrowLeft, Ban, Ellipsis, Users } from '@/components/ui/SvgIcons';
import { TidePanel } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { BlockUserDialog } from '@/features/blocks/BlockUserDialog';
import { unblockUser } from '@/features/blocks/service';
import { BlockedBadge, FollowButton } from '@/features/follows/FollowButton';
import { type FollowList, FollowListDialog } from '@/features/follows/FollowListDialog';
import type { Poll } from '@/features/polls/schema';
import { getUserPolls } from '@/features/polls/service';
import { splitAsked } from '@/features/profiles/lists';
import { rememberFollowing } from '@/features/profiles/ProfileHoverCard';
import { AskedRow, ProfileSection } from '@/features/profiles/ProfileRows';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';
import { apiErrorText } from '@/lib/api/error-text';
import { profileHref } from '@/lib/routes';
import type { UserProfile } from '@/types/user';

import ProfileHeader from './ProfileHeader';
import { ProfileRecord } from './ProfileRecord';

type Filter = 'all' | 'open' | 'ended';

/**
 * Someone's public profile: who they are, their public record and the polls
 * they asked. Follow sits where Edit profile sits on your own page. The owner
 * can preview it (`preview`), without the controls a visitor gets.
 */
export function VisitorProfileView({
	profile,
	polls,
	isAuthenticated,
	preview = false,
}: {
	profile: UserProfile;
	/** Null when the polls couldn't load */
	polls: CursorPage<Poll> | null;
	isAuthenticated: boolean;
	/** The owner looking at what everyone sees. */
	preview?: boolean;
}) {
	const { t } = useLanguage();
	const [list, setList] = useState<FollowList | null>(null);
	const canAct = isAuthenticated && !preview;

	return (
		<div className="px-contain mx-auto flex max-w-[1080px] flex-col gap-10 py-6 md:py-10 xl:flex-row xl:items-start">
			<main className="flex min-w-0 flex-1 flex-col gap-6 xl:max-w-[720px]">
				{preview && (
					<TidePanel className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-[13px]">
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
					profile={profile}
					onOpenList={isAuthenticated ? setList : undefined}
					actions={canAct && <VisitorActions profile={profile} />}
				/>
				{isAuthenticated && (
					<FollowListDialog username={profile.username} list={list} onOpenChange={(open) => !open && setList(null)} />
				)}
				<ProfileRecord
					cells={[
						{ label: t('profile.recordAsked'), value: profile.totalPolls },
						{ label: t('profile.recordVoted'), value: profile.totalVotes },
					]}
				/>
				<AskedList username={profile.username} initialPage={polls} />
			</main>

			{canAct && (
				<aside className="flex w-full flex-col gap-3 xl:sticky xl:top-8 xl:w-[280px] xl:shrink-0">
					<TidePanel className="p-3.5 text-[13px] leading-relaxed">
						<p className="mb-1 flex items-center gap-1.5 font-medium">
							<Users aria-hidden className="size-3.5 shrink-0 text-tide" />
							{t('profile.followingNoteTitle')}
						</p>
						<p>{t('profile.followingNoteBody')}</p>
					</TidePanel>
				</aside>
			)}
		</div>
	);
}

/** Follow (or Blocked) and the ••• menu with Block or Unblock. */
function VisitorActions({ profile }: { profile: UserProfile }) {
	const { t } = useLanguage();
	const router = useRouter();
	const [blockOpen, setBlockOpen] = useState(false);

	const unblock = async () => {
		const result = await unblockUser(profile.id);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'blocks.unblockFailed'));
			return;
		}
		toast.success(t('blocks.unblocked', { username: profile.username }));
		router.refresh();
	};

	return (
		<>
			{profile.isBlocked ? (
				<BlockedBadge />
			) : (
				profile.isFollowing != null && (
					<FollowButton
						userId={profile.id}
						initialFollowing={profile.isFollowing}
						onChange={(following) => rememberFollowing(profile.username, following)}
					/>
				)
			)}
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
								onClick={profile.isBlocked ? unblock : () => setBlockOpen(true)}
								className="flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-destructive outline-none data-highlighted:bg-foreground/5"
							>
								<Ban aria-hidden className="size-4" />
								{profile.isBlocked ? t('blocks.unblock') : t('blocks.blockEllipsis')}
							</Menu.Item>
						</Menu.Popup>
					</Menu.Positioner>
				</Menu.Portal>
			</Menu.Root>
			<BlockUserDialog
				username={profile.username}
				open={blockOpen}
				onOpenChange={setBlockOpen}
				onBlocked={() => router.refresh()}
			/>
		</>
	);
}

/** Their polls, Open (and opening soon) first, then Ended; filtered over the pages loaded so far. */
function AskedList({ username, initialPage }: { username: string; initialPage: CursorPage<Poll> | null }) {
	const { t } = useLanguage();
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
				<h2 className="relative inline-flex h-11 items-center gap-1.5 text-[14px] font-medium after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-foreground">
					{t('profile.tabAsked')}
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
					<LoadMore list={list} />
				</>
			)}
		</section>
	);
}
