'use client';

import { PreviewCard } from '@base-ui/react/preview-card';
import { type ReactElement, useState } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import type { UserProfile } from '@/types/user';

import { profileDetails } from './details';

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
	const state: CardState = stored.username === username ? stored : { username, status: 'idle' };

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
			<PreviewCard.Trigger render={children} />
			<PreviewCard.Portal>
				<PreviewCard.Positioner side="bottom" align="start" sideOffset={8} className="isolate z-50">
					{/* React events bubble out of portals: keep clicks in the card from reaching a row link around the trigger */}
					<PreviewCard.Popup
						onClick={(event) => event.stopPropagation()}
						className="w-72 origin-(--transform-origin) rounded-xl border border-border bg-card p-4 text-foreground shadow-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
						<ProfileCardBody username={username} avatarUrl={avatarUrl} state={state} />
					</PreviewCard.Popup>
				</PreviewCard.Positioner>
			</PreviewCard.Portal>
		</PreviewCard.Root>
	);
}

function ProfileCardBody({
	username,
	avatarUrl,
	state,
}: {
	username: string;
	avatarUrl?: string | null;
	state: CardState;
}) {
	const { t, currentLanguage } = useLanguage();
	const profile = state.status === 'ready' ? state.profile : null;
	const displayName = profile?.displayName;

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				{/* The page's avatarUrl is fresher than the cached profile */}
				<UserAvatar username={username} avatarUrl={avatarUrl ?? profile?.avatarUrl} className="size-11" />
				<div className="min-w-0">
					<p className="truncate text-[15px] font-medium">{displayName || username}</p>
					{displayName && <p className="truncate font-mono text-[13px] text-muted-foreground">@{username}</p>}
				</div>
			</div>
			{state.status === 'loading' && (
				<div aria-hidden className="space-y-2">
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-2/3" />
				</div>
			)}
			{state.status === 'failed' && <p className="text-[13px] text-muted-foreground">{t('profile.cardFailed')}</p>}
			{state.status === 'ready' && !profile && (
				<p className="text-[13px] text-muted-foreground">{t('profile.notFoundTitle')}</p>
			)}
			{profile?.bio && <p className="line-clamp-3 text-[13px]">{profile.bio}</p>}
			{profile && (
				<p className="text-[13px] text-muted-foreground">
					{profileDetails(profile, t, currentLanguage).join(' · ')}
				</p>
			)}
		</div>
	);
}
