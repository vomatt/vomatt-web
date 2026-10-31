'use client';

import { PreviewCard } from '@base-ui/react/preview-card';
import { type ReactElement, useRef, useState } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { type Follow, FollowButton, UnfollowDialog, useFollow } from '@/features/follows/FollowButton';
import { FollowListDialog } from '@/features/follows/FollowListDialog';
import { formatMonthYear } from '@/features/polls/format';
import { countText } from '@/lib/count';
import type { UserProfile } from '@/types/user';

import { Count } from './Count';
import { MutualFollowersLine } from './MutualFollowers';
import { profileName } from './name';

// Matches the route's max-age, so an edited profile shows within a minute
const PROFILE_TTL_MS = 60_000;

/** `profile` is set once the request is in; null for a username no one uses. */
type Entry = { at: number; request: Promise<UserProfile | null>; profile?: UserProfile | null };

// One request per username per minute, shared by every card that shows it
const profiles = new Map<string, Entry>();

async function fetchProfile(username: string): Promise<UserProfile | null> {
	const response = await fetch(`/api/profiles/${encodeURIComponent(username)}`);
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`Profile request for ${username} failed: ${response.status}`);
	return response.json();
}

function loadProfile(username: string) {
	const cached = profiles.get(username);
	if (cached && Date.now() - cached.at < PROFILE_TTL_MS) return cached;
	const entry: Entry = { at: Date.now(), request: fetchProfile(username) };
	entry.request.then(
		(profile) => {
			entry.profile = profile;
		},
		() => {
			// Dropped so the next open retries
			if (profiles.get(username) === entry) profiles.delete(username);
		}
	);
	profiles.set(username, entry);
	return entry;
}

/** Keeps a cached card in step with Follow (from the card, a list or the profile), so reopening it shows the new state and count. */
export function rememberFollowing(username: string, isFollowing: boolean) {
	const entry = profiles.get(username);
	if (entry?.profile) {
		const { profile } = entry;
		const followersCount = profile.followersCount + Number(isFollowing) - Number(!!profile.isFollowing);
		entry.profile = { ...profile, isFollowing, followersCount };
	}
	// Still loading: its answer may predate the follow, so the next open asks again
	else forgetProfile(username);
}

/** Drops a cached card, e.g. after a block or unblock, so the next open asks again. */
export function forgetProfile(username: string) {
	profiles.delete(username);
}

/** Tied to the username it was loaded for, so a reused card never shows someone else. */
type CardState = { username: string } & (
	| { status: 'idle' | 'loading' | 'failed' }
	| { status: 'ready'; profile: UserProfile | null }
);

/**
 * Hovering or focusing `children` (a link or span) shows a brief profile card.
 * It shows only what the person made public: the API sends hidden fields as null.
 */
export function ProfileHoverCard({
	username,
	avatarUrl,
	children,
}: {
	username: string;
	avatarUrl?: string | null;
	children: ReactElement;
}) {
	const [stored, setState] = useState<CardState>({ username, status: 'idle' });
	const [mutualsOpen, setMutualsOpen] = useState(false);
	const triggerRef = useRef<HTMLAnchorElement>(null);
	const state: CardState = stored.username === username ? stored : { username, status: 'idle' };
	const profile = state.status === 'ready' ? state.profile : null;
	// The page's avatarUrl is fresher than the cached profile
	const shownAvatarUrl = avatarUrl ?? profile?.avatarUrl;
	// Here, not in the card, so the unfollow confirm and its request outlive the card closing.
	// Signed out, and on the viewer's own card, the relation is null too
	const follow = useFollow(profile?.id ?? '', profile ?? NO_RELATION, {
		onChange: (following) => rememberFollowing(username, following),
	});

	const load = () => {
		const entry = loadProfile(username);
		// Already in (from this card or another): open straight to it
		if (entry.profile !== undefined) return setState({ username, status: 'ready', profile: entry.profile });
		// While refetching an expired one, keep showing what's there
		if (state.status !== 'ready') setState({ username, status: 'loading' });
		entry.request.then(
			(profile) => setState({ username, status: 'ready', profile }),
			() => setState({ username, status: 'failed' })
		);
	};

	return (
		<PreviewCard.Root onOpenChange={(open) => open && load()}>
			<PreviewCard.Trigger ref={triggerRef} render={children} />
			<PreviewCard.Portal>
				<PreviewCard.Positioner side="bottom" align="start" sideOffset={8} className="isolate z-50">
					{/* React events bubble out of portals: keep clicks in the card from reaching a row link around the trigger */}
					<PreviewCard.Popup
						onClick={(event) => event.stopPropagation()}
						className="w-80 origin-(--transform-origin) rounded-2xl border border-border bg-card p-4 text-foreground shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
						<ProfileCardBody
							username={username}
							avatarUrl={shownAvatarUrl}
							state={state}
							follow={follow}
							onOpenMutuals={() => setMutualsOpen(true)}
						/>
					</PreviewCard.Popup>
				</PreviewCard.Positioner>
			</PreviewCard.Portal>
			{/* Outside the popup, which closes as a dialog takes focus; their clicks are kept from a row link too */}
			<span className="contents" onClick={(event) => event.stopPropagation()}>
				{mutualsOpen && <FollowListDialog username={username} list="mutuals" onOpenChange={setMutualsOpen} />}
				{/* Focus goes back to the trigger: the button that opened it left with the card */}
				<UnfollowDialog follow={follow} username={username} avatarUrl={shownAvatarUrl} finalFocus={triggerRef} />
			</span>
		</PreviewCard.Root>
	);
}

// Before the profile is in there is no relation, so no button
const NO_RELATION = { isFollowing: null };

function ProfileCardBody({
	username,
	avatarUrl,
	state,
	follow,
	onOpenMutuals,
}: {
	username: string;
	avatarUrl?: string | null;
	state: CardState;
	follow: Follow;
	onOpenMutuals: () => void;
}) {
	const { t, currentLanguage } = useLanguage();
	const profile = state.status === 'ready' ? state.profile : null;
	const name = profileName({ ...profile, username });

	return (
		<div className="space-y-3">
			<div className="flex items-start gap-3">
				<UserAvatar username={username} avatarUrl={avatarUrl} className="size-12" />
				<div className="min-w-0 flex-1">
					<p className="truncate text-title-4 leading-tight">
						{name.primary}
						{name.secondary && <span className="text-muted-foreground"> {name.secondary}</span>}
					</p>
					<p className="truncate text-caption-2 text-muted-foreground">@{username}</p>
				</div>
				<FollowButton follow={follow} username={username} avatarUrl={avatarUrl} size="xs" withConfirm={false} />
			</div>
			{state.status === 'loading' && (
				<div aria-hidden className="space-y-2">
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-2/3" />
				</div>
			)}
			{state.status === 'failed' && <p className="text-caption-2 text-muted-foreground">{t('profile.cardFailed')}</p>}
			{state.status === 'ready' && !profile && (
				<p className="text-caption-2 text-muted-foreground">{t('profile.notFoundTitle')}</p>
			)}
			{profile?.bio && <p className="line-clamp-3 text-caption-1 leading-normal">{profile.bio}</p>}
			{profile && (
				<p className="flex flex-wrap gap-x-3 gap-y-1 text-caption-2 text-muted-foreground">
					<span className="whitespace-nowrap">
						<Count value={profile.totalPolls} label={countText(t, 'profile.askedCount', profile.totalPolls, currentLanguage)} />
					</span>
					<span className="whitespace-nowrap">
						<Count
							value={profile.followersCount + follow.delta}
							label={countText(t, 'profile.followersCount', profile.followersCount + follow.delta, currentLanguage)}
						/>
					</span>
					<span className="whitespace-nowrap">
						{t('profile.joined', { date: formatMonthYear(profile.joinedAt, currentLanguage) })}
					</span>
				</p>
			)}
			{profile && <MutualFollowersLine profile={profile} onOpen={onOpenMutuals} />}
		</div>
	);
}
