'use client';

import { MessageSquare, Share2 } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';

import { useSharePoll } from '../hooks/useSharePoll';

type PollFooterProps = {
	pollId: string;
	title: string;
	turnout: number | undefined;
	/** Unknown until the discussion has been opened once. */
	commentCount?: number;
	onToggleComments: () => void;
};

/** Turnout, comments and share. Turnout shows in every state. */
export function PollFooter({
	pollId,
	title,
	turnout,
	commentCount,
	onToggleComments,
}: PollFooterProps) {
	const { t } = useLanguage();

	const share = useSharePoll();

	return (
		<div className="flex items-center gap-4 border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
			{turnout !== undefined && (
				<span className="font-mono tabular-nums">
					{t('poll.voted', { count: turnout.toLocaleString() })}
				</span>
			)}
			<button
				type="button"
				onClick={onToggleComments}
				className="flex items-center gap-1.5 transition-colors hover:text-foreground"
			>
				<MessageSquare className="size-3.5" />
				{commentCount === undefined
					? t('poll.discuss')
					: commentCount === 1
						? t('poll.comment')
						: t('poll.comments', { count: commentCount })}
			</button>
			<button
				type="button"
				onClick={() => share({ id: pollId, title })}
				className="ml-auto flex items-center gap-1.5 transition-colors hover:text-foreground"
			>
				<Share2 className="size-3.5" />
				{t('poll.share')}
			</button>
		</div>
	);
}
