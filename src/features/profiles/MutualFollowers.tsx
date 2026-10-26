'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { countText } from '@/lib/count';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/user';

type Mutuals = Pick<UserProfile, 'mutualFollowersCount' | 'mutualFollowersPreview'>;

/**
 * "Followed by @jtan and 2 others you follow" beside up to two stacked avatars.
 * Nothing signed out, on the viewer's own profile, or when no one they follow
 * follows this person. With `onOpen` the line is a button that opens the list.
 */
export function MutualFollowersLine({ profile, onOpen }: { profile: Mutuals; onOpen?: () => void }) {
	const { t, currentLanguage } = useLanguage();
	const count = profile.mutualFollowersCount ?? 0;
	const shown = (profile.mutualFollowersPreview ?? []).slice(0, Math.min(count, 2));
	const [first, second] = shown;
	if (!first) return null;

	const others = count - 1;
	const text =
		others === 0
			? t('profile.mutualsOne', { name: first.username })
			: others === 1 && second
				? t('profile.mutualsTwo', { name: first.username, other: second.username })
				: countText(t, 'profile.mutualsMore', others, currentLanguage, { name: first.username });

	const content = (
		<>
			<span className="flex shrink-0">
				{shown.map((user, index) => (
					<UserAvatar
						key={user.id}
						username={user.username}
						avatarUrl={user.avatarUrl}
						className={cn('size-4', index > 0 && '-ml-2.5')}
					/>
				))}
			</span>
			{text}
		</>
	);

	const className = 'flex items-center gap-1.5 text-left text-[12px] text-muted-foreground';
	if (!onOpen) return <p className={className}>{content}</p>;
	return (
		<button
			type="button"
			onClick={onOpen}
			className={cn(
				className,
				'rounded-sm transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring'
			)}
		>
			{content}
		</button>
	);
}
