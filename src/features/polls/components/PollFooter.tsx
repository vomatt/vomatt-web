'use client';

import Link from 'next/link';

import { MessageSquare, Share2 } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';

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
	/** Set on the poll page, where the discussion folds in place; elsewhere the button leads there. */
	onToggleComments?: () => void;
};

/** Turnout (and a non-Public Audience), comments and share. Turnout shows in every state. */
export function PollFooter({
	pollId,
	title,
	turnout,
	audience,
	commentCount,
	onToggleComments,
}: PollFooterProps) {
	const { t } = useLanguage();

	const share = useSharePoll();
	const commentsLabel =
		commentCount === undefined
			? t('poll.discuss')
			: commentCount === 1
				? t('poll.comment')
				: t('poll.comments', { count: commentCount });
	const commentsClassName = 'flex min-h-11 items-center gap-2 transition-colors hover:text-foreground';
	const meta = [
		turnout !== undefined && t('poll.voted', { count: turnout.toLocaleString() }),
		audience && audience !== 'public' && t(`poll.audienceMeta.${audience}`),
	]
		.filter(Boolean)
		.join(' · ');

	return (
		// Each item is 44px tall; 4px above and below set the text 16px in
		<div className="flex items-center gap-5 border-t border-border px-5 py-1 text-[14px] text-muted-foreground md:px-8">
			{meta && <span className="font-mono tabular-nums">{meta}</span>}
			{onToggleComments ? (
				<button type="button" onClick={onToggleComments} className={commentsClassName}>
					<MessageSquare className="size-[18px]" />
					{commentsLabel}
				</button>
			) : (
				<Link href={`/poll/${pollId}#discussion`} className={commentsClassName}>
					<MessageSquare className="size-[18px]" />
					{commentsLabel}
				</Link>
			)}
			<button
				type="button"
				onClick={() => share({ id: pollId, title })}
				className="ml-auto flex min-h-11 items-center gap-2 transition-colors hover:text-foreground"
			>
				<Share2 className="size-[18px]" />
				{t('poll.share')}
			</button>
		</div>
	);
}
