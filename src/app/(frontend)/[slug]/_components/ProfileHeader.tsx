'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { EyeOff } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { AvatarDialog } from '@/features/avatars/AvatarDialog';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { profileDetails } from '@/features/profiles/details';
import { toPayloadLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/user';

import FollowButton from './FollowButton';
import FollowersSheet from './FollowersSheet';

type HeaderProfile = Pick<
	UserProfile,
	| 'username'
	| 'displayName'
	| 'bio'
	| 'joinedAt'
	| 'avatarUrl'
	| 'location'
	| 'points'
	| 'membershipLevel'
>;

/**
 * The same header for the owner and for visitors. Visitors get only the fields
 * the owner made public: the API sends hidden ones as null, so they drop out.
 * The owner sees their hidden name and bio dimmed and marked, and every hidden
 * field listed in one note (`hiddenFields`); their avatar opens the dialog to change it.
 */
export default function ProfileHeader({
	profile,
	action,
	meta,
	isOwn = false,
	hiddenFields = [],
}: {
	profile: HeaderProfile;
	action?: ReactNode;
	/** Counts shown in a row under the details, one element per count */
	meta?: ReactNode;
	isOwn?: boolean;
	/** Fields visitors don't see; only the owner's header passes them */
	hiddenFields?: readonly string[];
}) {
	const { t, currentLanguage } = useLanguage();
	const name = profile.displayName || profile.username;
	const isHidden = (field: string) => hiddenFields.includes(field);

	const details = profileDetails(profile, t, currentLanguage);
	// Hidden details leave the line and are listed once in the owner's note, with the hidden name and bio
	const shownDetails = details.filter((part) => !isHidden(part.field));
	const hiddenItems = [
		...(['displayName', 'bio'] as const)
			.filter(isHidden)
			.map((field) => t(`account.field.${field}`)),
		...details.filter((part) => isHidden(part.field)).map((part) => part.text),
	];

	return (
		<header className="flex flex-wrap items-start gap-x-5 gap-y-4">
			{isOwn ? (
				<AvatarDialog
					username={profile.username}
					avatarUrl={profile.avatarUrl}
					className="size-20"
				/>
			) : (
				<UserAvatar
					username={profile.username}
					avatarUrl={profile.avatarUrl}
					className="size-20"
					tooltip
				/>
			)}
			<div className="min-w-0 flex-1">
				<h1
					className={cn(
						'wrap-anywhere display-heading text-2xl',
						isHidden('displayName') && 'text-muted-foreground'
					)}
				>
					{name}
					{isHidden('displayName') && (
						<OnlyYouMarker className="ml-2 size-5 align-baseline" />
					)}
				</h1>
				{profile.displayName && (
					<p className="wrap-anywhere font-mono text-sm text-muted-foreground">
						@{profile.username}
					</p>
				)}
				{profile.bio && (
					<p
						className={cn(
							'mt-3 wrap-anywhere whitespace-pre-line text-[15px]',
							isHidden('bio') && 'text-muted-foreground'
						)}
					>
						{profile.bio}
						{isHidden('bio') && (
							<OnlyYouMarker className="ml-1.5 size-3.5 align-[-0.125em]" />
						)}
					</p>
				)}
				{/* Details, then counts: a row each, items set apart by space and kept whole when they wrap */}
				<div className="mt-3 space-y-1 text-[13px] text-muted-foreground tabular-nums">
					<div className="flex flex-wrap gap-x-4 gap-y-1">
						{shownDetails.map((part) => (
							<span key={part.field} className="wrap-anywhere">
								{keepWhole(part.text)}
							</span>
						))}
					</div>
					{meta && <div className="flex flex-wrap gap-x-4 gap-y-1">{meta}</div>}
				</div>
				{hiddenItems.length > 0 && (
					<p className="mt-2 wrap-anywhere text-[13px] text-muted-foreground">
						<EyeOff
							aria-hidden
							className="mr-1.5 inline size-3.5 align-[-0.125em]"
						/>
						{t('profile.onlyYouSee', {
							items: new Intl.ListFormat(
								toPayloadLocale(currentLanguage)
							).format(hiddenItems.map(keepWhole)),
						})}{' '}
						<Link
							href="/settings"
							className="whitespace-nowrap rounded-sm underline underline-offset-3 transition-colors hover:text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
						>
							{t('profile.onlyYouSettings')}
						</Link>
					</p>
				)}
			</div>
			{/* Own row until there's room beside the name with the sidebar open; empty:hidden drops it when the action renders nothing */}
			<div className="basis-full empty:hidden lg:basis-auto">{action}</div>
		</header>
	);
}

/**
 * No-break spaces keep a short item ("Joined Oct 2026") on one line; `wrap-anywhere`
 * on its container still breaks it when it's wider than the column (a long location).
 */
export const keepWhole = (text: string) => text.replace(/ /g, '\u00a0');

/** Marks a field only the owner can see: an eye-off icon, named for screen readers. */
export function OnlyYouMarker({ className }: { className?: string }) {
	const { t } = useLanguage();
	return (
		<>
			<EyeOff
				aria-hidden
				className={cn('inline shrink-0 text-muted-foreground', className)}
			/>
			<span className="sr-only">({t('profile.onlyYou')})</span>
		</>
	);
}

/** Follow toggle and counts; renders nothing until the backend supports follows. */
export function FollowControls({
	profile,
	isAuthenticated,
}: {
	profile: UserProfile;
	isAuthenticated: boolean;
}) {
	const { t } = useLanguage();
	const [sheetType, setSheetType] = useState<'followers' | 'following' | null>(
		null
	);
	const { followersCount, followingCount } = profile;
	if (followersCount === undefined && followingCount === undefined) return null;

	return (
		<div className="flex items-center gap-4 text-sm">
			{followersCount !== undefined &&
				(isAuthenticated ? (
					<FollowButton
						username={profile.username}
						initialIsFollowing={profile.isFollowing ?? false}
						initialFollowersCount={followersCount}
						onOpenFollowers={() => setSheetType('followers')}
					/>
				) : (
					<button
						type="button"
						onClick={() => setSheetType('followers')}
						className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
					>
						<span className="font-semibold text-foreground">
							{followersCount}
						</span>
						<span className="text-muted-foreground text-xs">
							{t('profile.followers')}
						</span>
					</button>
				))}
			{followingCount !== undefined && (
				<button
					type="button"
					onClick={() => setSheetType('following')}
					className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
				>
					<span className="font-semibold text-foreground">
						{followingCount}
					</span>
					<span className="text-muted-foreground text-xs">
						{t('profile.following')}
					</span>
				</button>
			)}
			<FollowersSheet
				username={profile.username}
				type={sheetType ?? 'followers'}
				open={sheetType !== null}
				onOpenChange={(open) => {
					if (!open) setSheetType(null);
				}}
			/>
		</div>
	);
}
