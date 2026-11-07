'use client';

import { UserRelationPanel } from '@/features/profiles/UserRelationPanel';

import { getBlockedUsers, unblockUser } from './service';

/** The Blocked people page body (Settings › Blocked people): the people the user blocked, each with Unblock. */
export function BlockedUsersPanel() {
	return <UserRelationPanel ns="blocks" action="unblock" load={getBlockedUsers} remove={unblockUser} />;
}
