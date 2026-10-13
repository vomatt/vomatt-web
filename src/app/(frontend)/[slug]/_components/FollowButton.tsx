'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { followUser, unfollowUser } from '@/lib/api/services/users';

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  onOpenFollowers?: () => void;
}

export default function FollowButton({
  username,
  initialIsFollowing,
  initialFollowersCount,
  onOpenFollowers,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    if (isPending) return;
    const wasFollowing = isFollowing;
    const prevCount = followersCount;

    // Optimistic update — both state values change together
    setIsFollowing(!wasFollowing);
    setFollowersCount(wasFollowing ? prevCount - 1 : prevCount + 1);
    setIsPending(true);

    try {
      if (wasFollowing) {
        await unfollowUser(username);
      } else {
        await followUser(username);
      }
    } catch {
      // Revert both on error
      setIsFollowing(wasFollowing);
      setFollowersCount(prevCount);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Followers count — rendered here so it updates optimistically */}
      <button
        type="button"
        onClick={onOpenFollowers}
        aria-label={`View ${followersCount} people who subscribe`}
        className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
      >
        <span className="font-semibold text-foreground text-sm" aria-hidden="true">{followersCount}</span>
        <span className="text-muted-foreground text-xs" aria-hidden="true">Followers</span>
      </button>

      <Button
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </Button>
    </div>
  );
}
