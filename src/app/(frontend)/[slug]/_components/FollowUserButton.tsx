'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { followUser, unfollowUser } from '@/features/follows/service';
import { apiErrorText } from '@/lib/api/error-text';

/** Follows or unfollows another user; the follow is private. The parent owns the state. */
export default function FollowUserButton({
	userId,
	username,
	isFollowing,
	onChange,
}: {
	userId: string;
	username: string;
	isFollowing: boolean;
	onChange: (isFollowing: boolean) => void;
}) {
	const { t } = useLanguage();
	const [isPending, setIsPending] = useState(false);

	const toggle = async () => {
		setIsPending(true);
		const result = await (isFollowing ? unfollowUser(userId) : followUser(userId)).finally(() => setIsPending(false));
		if (!result.ok) {
			toast.error(apiErrorText(t, result, isFollowing ? 'follows.unfollowFailed' : 'follows.followFailed'), {
				duration: Infinity,
			});
			return;
		}
		onChange(!isFollowing);
		if (isFollowing) {
			toast.success(t('follows.unfollowed', { username }));
			return;
		}
		toast.success(t('follows.followed', { username }), {
			description: (
				<Link href="/settings" className="underline underline-offset-3">
					{t('follows.manage')}
				</Link>
			),
		});
	};

	return (
		<Button variant={isFollowing ? 'outline' : 'default'} size="sm" loading={isPending} onClick={toggle}>
			{isFollowing ? t('follows.unfollow') : t('follows.follow')}
		</Button>
	);
}
