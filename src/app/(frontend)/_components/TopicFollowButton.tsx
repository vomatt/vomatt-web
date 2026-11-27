'use client';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Check, Plus } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { followTag, unfollowTag } from '@/features/polls/service';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';

/** Following a topic adds its Open Public Polls to the Following feed. One tap undoes it. */
export function TopicFollowButton({
	tagId,
	initiallyFollowing,
}: {
	tagId: string;
	initiallyFollowing: boolean;
}) {
	const { t } = useLanguage();
	const [following, setFollowing] = useState(initiallyFollowing);
	const [isPending, setIsPending] = useState(false);

	const toggle = async () => {
		const next = !following;
		setFollowing(next);
		setIsPending(true);
		const result = await settle(next ? followTag(tagId) : unfollowTag(tagId));
		setIsPending(false);
		if (!result.ok) {
			setFollowing(!next);
			toast.error(
				apiErrorText(
					t,
					result,
					next ? 'homePage.followTopicFailed' : 'homePage.unfollowTopicFailed'
				)
			);
		}
	};

	return (
		<Button
			size="sm"
			variant={following ? 'outline' : 'default'}
			aria-pressed={following}
			onClick={toggle}
			disabled={isPending}
			// Starts where the first card would, level with the rail's first card
			className="mt-2 mb-2"
		>
			{following ? <Check aria-hidden /> : <Plus aria-hidden />}
			{t(following ? 'homePage.followingTopic' : 'homePage.followTopic')}
		</Button>
	);
}
