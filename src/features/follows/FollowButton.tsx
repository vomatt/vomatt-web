'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Check, Plus } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { cn } from '@/lib/utils';

import { followUser, unfollowUser } from './service';

/**
 * The one Follow button, wherever a person is. Ink while not following; once
 * following it drops to outline (the page's primary action stays Create) and
 * hovering or focusing it offers Unfollow. No confirm: one tap undoes it.
 * `size`: `sm` (36px) in a profile header, `xs` (32px) on the hover card and in rows.
 */
export function FollowButton({
	userId,
	initialFollowing,
	onChange,
	size = 'sm',
	className,
}: {
	userId: string;
	initialFollowing: boolean;
	/** After the server confirmed the new state. */
	onChange?: (following: boolean) => void;
	size?: 'sm' | 'xs';
	className?: string;
}) {
	const { t } = useLanguage();
	const [following, setFollowing] = useState(initialFollowing);
	const [isPending, setIsPending] = useState(false);

	const toggle = async () => {
		const next = !following;
		// Optimistic: the label changes on the tap, and goes back if the server refuses
		setFollowing(next);
		setIsPending(true);
		const result = await settle(next ? followUser(userId) : unfollowUser(userId));
		setIsPending(false);
		if (!result.ok) {
			setFollowing(!next);
			toast.error(apiErrorText(t, result, next ? 'follows.followFailed' : 'follows.unfollowFailed'));
			return;
		}
		onChange?.(next);
	};

	if (!following) {
		return (
			<Button size={size} onClick={toggle} disabled={isPending} className={className}>
				<Plus aria-hidden />
				{t('follows.follow')}
			</Button>
		);
	}

	return (
		<Button
			size={size}
			variant="outline"
			aria-pressed
			onClick={toggle}
			disabled={isPending}
			className={cn(
				'hover:border-destructive hover:text-destructive focus-visible:border-destructive focus-visible:text-destructive',
				className
			)}
		>
			{/* Unfollow is this button's hover, never a second button */}
			<span className="inline-flex items-center gap-1.5 group-hover/button:hidden group-focus-visible/button:hidden">
				<Check aria-hidden />
				{t('follows.following')}
			</span>
			<span className="hidden group-hover/button:inline group-focus-visible/button:inline">{t('follows.unfollow')}</span>
		</Button>
	);
}

/** In place of Follow once the viewer blocked the person; unblocking lives in the ••• menu and Settings. */
export function BlockedBadge() {
	const { t } = useLanguage();
	return (
		<span className="inline-flex h-11 items-center rounded-(--radius) border border-border bg-secondary px-3 text-sm font-medium text-muted-foreground md:h-9">
			{t('blocks.blockedBadge')}
		</span>
	);
}
