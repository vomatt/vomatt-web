'use client';

import { UserRelationPanel } from '@/features/profiles/UserRelationPanel';

import { getBlockedUsers, unblockUser } from './service';

/** Settings: people the user blocked, with a way to unblock each. */
export function BlockedUsersPanel() {
	return <UserRelationPanel ns="blocks" action="unblock" load={getBlockedUsers} remove={unblockUser} />;
}
