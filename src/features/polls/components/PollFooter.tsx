'use client';

import { Menu } from '@base-ui/react/menu';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { menuItemClassName, menuPopupClassName } from '@/components/ui/menu';
import { Bookmark, Ellipsis, Flag, MessageSquare, Share2 } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { toPayloadLocale } from '@/lib/locale';

import { useSharePoll } from '../hooks/useSharePoll';
import type { Audience } from '../schema';

type PollFooterProps = {
	pollId: string;
	title: string;
	turnout: number | undefined;
	/** Unlisted and Invite-only say so after the turnout: "18 voted · invite only". Public says nothing. */
	audience?: Audience;
	/** Unknown until the discussion has been opened once. */
	commentCount?: number;
	/** On the poll page Comments leads down to the discussion; elsewhere to the poll page's. */
	isPage?: boolean;
	/** Whether the viewer saved the Poll; the toggle shows once `onToggleBookmark` is given. */
	bookmarked?: boolean;
	onToggleBookmark?: () => void;
	/** Offered to everyone but the owner. */
	onReport?: () => void;
};

/** Turnout (and a non-Public Audience), comments, save, share and report. Turnout shows in every state. */
export function PollFooter({
	pollId,
	title,
	turnout,
	audience,
	commentCount,
	isPage,
	bookmarked,
	onToggleBookmark,
	onReport,
}: PollFooterProps) {
	const { t, currentLanguage } = useLanguage();

	const share = useSharePoll();
	const commentsLabel =
		commentCount === undefined
			? t('poll.discuss')
			: commentCount === 1
				? t('poll.comment')
				: t('poll.comments', { count: commentCount });
	const commentsClassName = 'flex min-h-11 items-center gap-2 transition-colors hover:text-foreground';
	const meta = [
		turnout !== undefined && t('poll.voted', { count: turnout.toLocaleString(toPayloadLocale(currentLanguage)) }),
		audience && audience !== 'public' && t(`poll.audienceMeta.${audience}`),
	]
		.filter(Boolean)
		.join(' · ');

	return (
		// Each item is 44px tall; 4px above and below set the text 16px in
		<div className="flex items-center gap-5 border-t border-border px-5 py-1 text-[14px] text-muted-foreground md:px-8">
			{meta && <span className="font-mono tabular-nums">{meta}</span>}
			<Link href={isPage ? '#discussion' : `/poll/${pollId}#discussion`} className={commentsClassName}>
				<MessageSquare className="size-[18px]" />
				{commentsLabel}
			</Link>
			<div className="ml-auto flex items-center gap-5">
				{onToggleBookmark && (
					<button
						type="button"
						onClick={onToggleBookmark}
						aria-pressed={!!bookmarked}
						className="flex min-h-11 items-center gap-2 transition-colors hover:text-foreground aria-pressed:text-foreground"
					>
						<Bookmark className="size-[18px]" fill={bookmarked ? 'currentColor' : 'none'} />
						{t(bookmarked ? 'poll.bookmarked' : 'poll.bookmark')}
					</button>
				)}
				<button
					type="button"
					onClick={() => share({ id: pollId, title })}
					className="flex min-h-11 items-center gap-2 transition-colors hover:text-foreground"
				>
					<Share2 className="size-[18px]" />
					{t('poll.share')}
				</button>
				{onReport && (
					<Menu.Root>
						<Menu.Trigger
							render={<Button variant="ghost" size="icon-xs" />}
							aria-label={t('poll.moreOptions')}
							className="-mx-2 data-popup-open:bg-muted"
						>
							<Ellipsis aria-hidden />
						</Menu.Trigger>
						<Menu.Portal>
							<Menu.Positioner side="top" align="end" sideOffset={4} className="z-50">
								<Menu.Popup className={menuPopupClassName}>
									<Menu.Item onClick={onReport} className={menuItemClassName}>
										<Flag aria-hidden />
										{t('poll.report')}
									</Menu.Item>
								</Menu.Popup>
							</Menu.Positioner>
						</Menu.Portal>
					</Menu.Root>
				)}
			</div>
		</div>
	);
}
