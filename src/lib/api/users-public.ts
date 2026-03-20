import { publicFetch } from '@/lib/api/client';
import type { UserSummary } from '@/types/user';

export interface FollowListPage {
  content: UserSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
}

export async function getFollowers(
  username: string,
  page = 0,
  size = 20
): Promise<FollowListPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return publicFetch<FollowListPage>(
    `${process.env.API_URL}/api/v1/users/${encodeURIComponent(username)}/followers?${params}`
  );
}

export async function getFollowing(
  username: string,
  page = 0,
  size = 20
): Promise<FollowListPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return publicFetch<FollowListPage>(
    `${process.env.API_URL}/api/v1/users/${encodeURIComponent(username)}/following?${params}`
  );
}
