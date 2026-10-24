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
	stats,
	isOwn = false,
	hiddenFields = [],
}: {
	profile: HeaderProfile;
	action?: ReactNode;
	/** The counts card, under the details */
	stats?: ReactNode;
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
		// Phones: identity, about, stats, then the actions as one row. From md the actions sit beside the name
		<header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-5">
			{isOwn ? (
				<AvatarDialog
					username={profile.username}
					avatarUrl={profile.avatarUrl}
					className="size-18 md:size-20"
				/>
			) : (
				<UserAvatar
					username={profile.username}
					avatarUrl={profile.avatarUrl}
					className="size-18 md:size-20"
					tooltip
				/>
			)}
			<div className="min-w-0">
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
			</div>
			<div className="col-span-full space-y-3 empty:hidden">
				{profile.bio && (
					<p
						className={cn(
							// Capped measure (~68 characters): the column runs ~87 wide between md and lg, and
							// Geist's wide 0 makes `ch` overshoot, so the cap is in rem
							'max-w-[30rem] wrap-anywhere whitespace-pre-line text-[14px]',
							isHidden('bio') && 'text-muted-foreground'
						)}
					>
						{profile.bio}
						{isHidden('bio') && (
							<OnlyYouMarker className="ml-1.5 size-3.5 align-[-0.125em]" />
						)}
					</p>
				)}
				{/* Items set apart by space and kept whole when they wrap */}
				{shownDetails.length > 0 && (
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground tabular-nums">
						{shownDetails.map((part) => (
							<span key={part.field} className="wrap-anywhere">
								{keepWhole(part.text)}
							</span>
						))}
					</div>
				)}
				{hiddenItems.length > 0 && (
					<p className="wrap-anywhere text-[12px] text-muted-foreground">
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
			{stats && <div className="col-span-full">{stats}</div>}
			{/* Last in reading order; dropped when the action, or its wrapper's contents, render nothing */}
			<div className="col-span-full empty:hidden has-[>:empty]:hidden md:col-span-1 md:col-start-3 md:row-start-1">{action}</div>
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
