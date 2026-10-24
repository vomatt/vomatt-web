'use client';

import { UserRelationPanel } from '@/features/profiles/UserRelationPanel';

import { getFollowedUsers, unfollowUser } from './service';

/** Settings: people the user follows, with a way to unfollow each. */
export function FollowedUsersPanel() {
	return <UserRelationPanel ns="follows" action="unfollow" load={getFollowedUsers} remove={unfollowUser} />;
}
