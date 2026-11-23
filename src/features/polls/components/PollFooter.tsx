'use client';

import { Menu } from '@base-ui/react/menu';
import Link from 'next/link';
import { useState } from 'react';

import { RowMenuRoot } from '@/components/RowMenuRoot';
import { Button, buttonVariants } from '@/components/ui/Button';
import { menuItemClassName, menuPopupClassName } from '@/components/ui/menu';
import {
	Bookmark,
	Ellipsis,
	Flag,
	MessageSquare,
	Share,
} from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { toLocaleTag } from '@/lib/locale';
import { META_GAP } from '@/lib/rich';
import { pollHref } from '@/lib/routes';

import { useSharePoll } from '../hooks/useSharePoll';
import type { Audience } from '../schema';
import { isPublic } from '../status';
import { LikeHeart } from './LikeHeart';
import { PollQrDialog, PollShareMenuItems } from './PollShareMenuItems';

type PollFooterProps = {
	pollId: string;
	title: string;
	turnout: number | undefined;
	/** Unlisted and Invite-only say so after the turnout: "18 voted" + gap + "invite only". Public says nothing. */
	audience?: Audience;
	/** Unknown until the discussion has been opened once. */
	commentCount?: number;
	/** On the poll page Comments leads down to the discussion; elsewhere to the poll page's. */
	isPage?: boolean;
	/** Whether the viewer saved the Poll; the toggle shows once `onToggleBookmark` is given. */
	bookmarked?: boolean;
	onToggleBookmark?: () => void;
	/** The like toggle shows once `onToggleLike` is given. */
	liked?: boolean;
	likeCount?: number;
	onToggleLike?: () => void;
	/** Offered to everyone but the owner. */
	onReport?: () => void;
};

/** Turnout (and a non-Public Audience), comments, save, share and a ••• menu (QR code, LINE, report). Turnout shows in every state. */
export function PollFooter({
	pollId,
	title,
	turnout,
	audience,
	commentCount,
	isPage,
	bookmarked,
	onToggleBookmark,
	liked,
	likeCount,
	onToggleLike,
	onReport,
}: PollFooterProps) {
	const { t, currentLanguage } = useLanguage();

	const share = useSharePoll();
	const [showsQr, setShowsQr] = useState(false);
	const commentsLabel =
		commentCount === undefined
			? t('poll.discuss')
			: commentCount === 1
				? t('poll.comment')
				: t('poll.comments', { count: commentCount });
	// The ••• trigger's ghost circle, as a pill for an action with a label; the footer's 14px regular type
	const pillClassName = buttonVariants({
		variant: 'ghost',
		size: 'xs',
		className: 'rounded-full px-2 text-body-4 font-normal',
	});
	const meta = [
		turnout !== undefined &&
			t('poll.voted', {
				count: turnout.toLocaleString(toLocaleTag(currentLanguage)),
			}),
		!isPublic({ audience }) && t(`poll.audienceMeta.${audience}`),
	]
		.filter(Boolean)
		.join(META_GAP);

	return (
		// Each row is 44px tall; 4px above and below set the text 16px in. Too narrow for one row
		// (320px, or a non-Public audience), the actions wrap to a second row on the right
		<div className="flex flex-wrap items-center gap-x-4 border-t border-border px-5 py-1 text-body-4 text-muted-foreground md:px-8">
			{meta && <span className="flex min-h-11 items-center tabular-nums">{meta}</span>}
			<Link
				href={isPage ? '#discussion' : `${pollHref(pollId)}#discussion`}
				className={`${pillClassName} -ml-2 gap-2`}
			>
				<MessageSquare className="size-[18px]" />
				{commentsLabel}
			</Link>
			<div className="ml-auto flex min-h-11 items-center gap-2">
				{onToggleLike && (
					<button
						type="button"
						onClick={onToggleLike}
						aria-pressed={!!liked}
						aria-label={t(liked ? 'poll.liked' : 'poll.like')}
						className={`${pillClassName} aria-pressed:text-foreground`}
					>
						<LikeHeart liked={!!liked} className="size-[18px]" />
						<span className="tabular-nums">
							{(likeCount ?? 0).toLocaleString(toLocaleTag(currentLanguage))}
						</span>
					</button>
				)}
				{onToggleBookmark && (
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={onToggleBookmark}
						aria-pressed={!!bookmarked}
						aria-label={t(bookmarked ? 'poll.bookmarked' : 'poll.bookmark')}
						className="aria-pressed:text-foreground"
					>
						<Bookmark
							aria-hidden
							className="size-[18px]"
							fill={bookmarked ? 'currentColor' : 'none'}
						/>
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => share({ id: pollId, title })}
					aria-label={t('poll.share')}
				>
					<Share aria-hidden className="size-[18px]" />
				</Button>
				<RowMenuRoot>
					<Menu.Trigger
						render={<Button variant="ghost" size="icon-xs" flush="end" />}
						aria-label={t('poll.moreOptions')}
						className="data-popup-open:bg-muted"
					>
						<Ellipsis aria-hidden />
					</Menu.Trigger>
					<Menu.Portal>
						<Menu.Positioner
							side="top"
							align="end"
							sideOffset={4}
							className="z-50"
						>
							<Menu.Popup className={menuPopupClassName}>
								<PollShareMenuItems pollId={pollId} onShowQr={() => setShowsQr(true)} />
								{onReport && (
									<Menu.Item onClick={onReport} className={menuItemClassName}>
										<Flag aria-hidden />
										{t('poll.report')}
									</Menu.Item>
								)}
							</Menu.Popup>
						</Menu.Positioner>
					</Menu.Portal>
				</RowMenuRoot>
				{showsQr && <PollQrDialog pollId={pollId} title={title} open onOpenChange={setShowsQr} />}
			</div>
		</div>
	);
}
