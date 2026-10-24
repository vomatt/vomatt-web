'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { followUserByUsername } from '@/features/follows/service';
import { apiErrorText } from '@/lib/api/error-text';

/** Follows another user privately; unfollowing lives in Settings, as unblocking does. */
export default function FollowUserButton({ username }: { username: string }) {
	const { t } = useLanguage();
	const [isFollowing, setIsFollowing] = useState(false);

	const follow = async () => {
		setIsFollowing(true);
		const result = await followUserByUsername(username);
		setIsFollowing(false);
		if (!result.ok || !result.data.found) {
			toast.error(result.ok ? t('follows.followFailed') : apiErrorText(t, result, 'follows.followFailed'), {
				duration: Infinity,
			});
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
		<Button size="sm" loading={isFollowing} onClick={follow}>
			{t('follows.follow')}
		</Button>
	);
}
