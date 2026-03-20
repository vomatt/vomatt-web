'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { getFollowers, getFollowing } from '@/lib/api/users-public';
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
                href={`/profile/${user.username}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 py-2 rounded-lg hover:bg-accent/50 transition-colors px-2 -mx-2"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName ?? user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-medium">
                      {(user.displayName ?? user.username).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
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
