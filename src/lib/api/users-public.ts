import { API_BASE_PATH } from '@/lib/api/constants';
import type { UserSummary } from '@/types/user';

export interface FollowListPage {
  content: UserSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
}

async function clientFetch<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(`${baseUrl}${API_BASE_PATH}${path}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const body = await res.json();
  return ('data' in body ? body.data : body) as T;
}

export async function getFollowers(
  username: string,
  page = 0,
  size = 20
): Promise<FollowListPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return clientFetch<FollowListPage>(
    `/users/${encodeURIComponent(username)}/followers?${params}`
  );
}

export async function getFollowing(
  username: string,
  page = 0,
  size = 20
): Promise<FollowListPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return clientFetch<FollowListPage>(
    `/users/${encodeURIComponent(username)}/following?${params}`
  );
}
