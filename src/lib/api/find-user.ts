import { collectPages } from '@/lib/api/cursor';
import { searchUsers } from '@/lib/api/services/users';
import type { UserDto } from '@/schemas/user';

/**
 * Public profiles carry no user ID, so find it through search (at most 5 pages
 * of matches). `null` when no such username turns up.
 */
export async function findUserByUsername(username: string): Promise<UserDto | null> {
	const wanted = username.toLowerCase();
	const isWanted = (user: UserDto) => user.username.toLowerCase() === wanted;
	const { items } = await collectPages((cursor) => searchUsers(username, cursor ?? undefined, 50), {
		maxPages: 5,
		until: (users) => users.some(isWanted),
	});
	return items.find(isWanted) ?? null;
}
