'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserProfile } from '@/types/user';

import BlockButton from './BlockButton';
import FollowersSheet from './FollowersSheet';
import FollowUserButton from './FollowUserButton';

/** Opens the Followers and Following sheets; the API serves both lists to signed-in viewers only. */
export function FollowListButtons({ username }: { username: string }) {
	const { t } = useLanguage();
	const [sheetType, setSheetType] = useState<'followers' | 'following'>('followers');
	const [open, setOpen] = useState(false);

	const show = (type: 'followers' | 'following') => {
		setSheetType(type);
		setOpen(true);
	};

	return (
		<>
			<Button variant="outline" size="sm" onClick={() => show('followers')}>
				{t('profile.followers')}
			</Button>
			<Button variant="outline" size="sm" onClick={() => show('following')}>
				{t('profile.following')}
			</Button>
			<FollowersSheet username={username} type={sheetType} open={open} onOpenChange={setOpen} />
		</>
	);
}

/**
 * A signed-in visitor's Follow and Block buttons. Blocking also unfollows, and a
 * blocked user can't be followed, so the Follow button gives way until unblocked.
 */
export function RelationActions({ profile }: { profile: UserProfile }) {
	const [isFollowing, setIsFollowing] = useState(profile.isFollowing ?? false);
	const [isBlocked, setIsBlocked] = useState(profile.isBlocked ?? false);

	return (
		<>
			{!isBlocked && (
				<FollowUserButton
					userId={profile.id}
					username={profile.username}
					isFollowing={isFollowing}
					onChange={setIsFollowing}
				/>
			)}
			<BlockButton
				userId={profile.id}
				username={profile.username}
				isBlocked={isBlocked}
				onChange={(blocked) => {
					setIsBlocked(blocked);
					if (blocked) setIsFollowing(false);
				}}
			/>
		</>
	);
}
