'use client';

import { toast } from 'sonner';

import { MessageSquare, Share2 } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';

import { fill } from '../format';

type PollFooterProps = {
	pollId: string;
	title: string;
	turnout: number | undefined;
	commentCount: number;
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

	const share = async () => {
		const url = `${window.location.origin}/poll/${pollId}`;
		if (navigator.share) {
			await navigator.share({ title, url }).catch(() => {});
			return;
		}
		await navigator.clipboard.writeText(url);
		toast(t('poll.linkCopied'));
	};

	return (
		<div className="flex items-center gap-4 border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
			{turnout !== undefined && (
				<span className="font-mono tabular-nums">
					{fill(t('poll.voted'), { count: turnout.toLocaleString() })}
				</span>
			)}
			<button
				type="button"
				onClick={onToggleComments}
				className="flex items-center gap-1.5 transition-colors hover:text-foreground"
			>
				<MessageSquare className="size-3.5" />
				{commentCount === 1
					? t('poll.comment')
					: fill(t('poll.comments'), { count: commentCount })}
			</button>
			<button
				type="button"
				onClick={share}
				className="ml-auto flex items-center gap-1.5 transition-colors hover:text-foreground"
			>
				<Share2 className="size-3.5" />
				{t('poll.share')}
			</button>
		</div>
	);
}
