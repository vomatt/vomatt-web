'use client';

import Link from 'next/link';
import { useId } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { ProfileHoverCard } from '@/features/profiles/ProfileHoverCard';
import { countText } from '@/lib/count';
import { profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/user';

const focusRing =
	'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

/**
 * The profile rail's card of the people the viewer follows who follow this
 * person: up to 3 rows, each opening that profile, then All followers, which
 * opens the followers list. Nothing when there are none or signed out.
 */
export function MutualFollowersCard({
	profile,
	onOpenFollowers,
}: {
	profile: Pick<UserProfile, 'mutualFollowersCount' | 'mutualFollowersPreview' | 'followersCount'>;
	onOpenFollowers: () => void;
}) {
	const { t, currentLanguage } = useLanguage();
	const headingId = useId();
	const people = profile.mutualFollowersPreview ?? [];
	if (!profile.mutualFollowersCount || people.length === 0) return null;

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-3">
			<h2 id={headingId} className="text-[12px] font-medium text-muted-foreground">
				{t('profile.mutualFollowers')}
			</h2>
			<div className="flex flex-col gap-0.5 rounded-2xl border border-border bg-card p-2">
				<ul className="flex flex-col gap-0.5">
					{people.map((user) => (
						<li key={user.id}>
							<ProfileHoverCard username={user.username} avatarUrl={user.avatarUrl}>
								<Link
									href={profileHref(user.username)}
									className={cn('flex items-center gap-2.5 rounded-[10px] p-2 transition-colors hover:bg-surface-soft', focusRing)}
								>
									<UserAvatar username={user.username} avatarUrl={user.avatarUrl} />
									<span className="flex min-w-0 flex-col">
										<span className="truncate text-[14px] font-medium">{user.displayName || user.username}</span>
										<span className="truncate font-mono text-[12px] text-muted-foreground">@{user.username}</span>
									</span>
								</Link>
							</ProfileHoverCard>
						</li>
					))}
				</ul>
				<button
					type="button"
					onClick={onOpenFollowers}
					className={cn(
						'flex min-h-11 items-center rounded-[10px] px-2 text-left text-[13px] font-medium underline underline-offset-3 md:min-h-9',
						focusRing
					)}
				>
					{countText(t, 'profile.allFollowers', profile.followersCount, currentLanguage)}
				</button>
			</div>
		</section>
	);
}
