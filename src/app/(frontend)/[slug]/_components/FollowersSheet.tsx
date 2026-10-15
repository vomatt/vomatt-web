'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { getFollowers, getFollowing } from '@/lib/api/users-public';
import { profileHref } from '@/lib/routes';
import type { UserSummary } from '@/types/user';

interface FollowersSheetProps {
  username: string;
  type: 'followers' | 'following';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

export default function FollowersSheet({
  username,
  type,
  open,
  onOpenChange,
}: FollowersSheetProps) {
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [users, setUsers] = useState<UserSummary[]>([]);

  useEffect(() => {
    if (!open) return;
    setFetchState('loading');
    setUsers([]);
    const fetchFn = type === 'followers' ? getFollowers : getFollowing;
    fetchFn(username, 0)
      .then((res) => {
        setUsers(res?.content ?? []);
        setFetchState('success');
      })
      .catch(() => setFetchState('error'));
  }, [open, username, type]);

  const title = type === 'followers' ? 'Followers' : 'Following';
  const emptyMessage =
    type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 px-4 mt-4">
          {fetchState === 'loading' &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}

          {fetchState === 'error' && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Failed to load — try again.
            </p>
          )}

          {fetchState === 'success' && users.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {emptyMessage}
            </p>
          )}

          {fetchState === 'success' &&
            users.map((user) => (
              <Link
                key={user.username}
                href={profileHref(user.username)}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 py-2 rounded-lg hover:bg-accent/50 transition-colors px-2 -mx-2"
              >
                <UserAvatar username={user.username} avatarUrl={user.avatarUrl} className="size-10" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.displayName ?? user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
