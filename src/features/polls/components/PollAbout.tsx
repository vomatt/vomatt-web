'use client';

import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Share2 } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';

import { formatFromNow, formatPollDate } from '../format';
import type { Poll } from '../schema';
import { derivePollStatus, getTurnout, timelineProgress } from '../status';

/** The side panel on the detail page: who asked, the voting window, turnout and topics. */
export function PollAbout({ poll }: { poll: Poll }) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const status = derivePollStatus(poll);
	const turnout = getTurnout(poll);
	const progress = isHydrated ? timelineProgress(poll) : null;

	const share = async () => {
		const url = window.location.href;
		if (navigator.share) {
			await navigator.share({ title: poll.title, url }).catch(() => {});
			return;
		}
		await navigator.clipboard.writeText(url);
		toast(t('poll.linkCopied'));
	};

	return (
		<aside className="space-y-5 rounded-xl border border-border bg-card p-5 text-sm">
			<div className="flex items-center gap-3">
				<div
					aria-hidden
					className="grid size-9 place-items-center rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground"
				>
					{poll.creatorUsername.slice(0, 1)}
				</div>
				<div className="min-w-0">
					<p className="text-xs text-muted-foreground">{t('pollDetail.askedBy')}</p>
					<Link href={`/profile/${poll.creatorUsername}`} className="font-medium hover:underline">
						{poll.creatorUsername}
					</Link>
				</div>
			</div>

			{isHydrated && (
				<div className="space-y-2">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>{t('pollDetail.opened', { date: formatPollDate(poll.startTime, currentLanguage) })}</span>
						{poll.endTime && <span>{formatPollDate(poll.endTime, currentLanguage)}</span>}
					</div>
					{progress !== null && (
						<div
							role="progressbar"
							aria-label={t('pollDetail.timeline')}
							aria-valuenow={Math.round(progress)}
							aria-valuemin={0}
							aria-valuemax={100}
							className="h-1.5 overflow-hidden rounded-full bg-muted"
						>
							<div
								className={status === 'closing' ? 'h-full bg-amber-500' : 'h-full bg-primary'}
								style={{ width: `${progress}%` }}
							/>
						</div>
					)}
					<p className="font-medium">
						{status === 'ended'
							? t('pollDetail.resultsIn')
							: status === 'scheduled'
								? t('poll.opensHint', { distance: formatFromNow(poll.startTime, currentLanguage) })
								: poll.endTime
									? t('pollDetail.revealsIn', { distance: formatFromNow(poll.endTime, currentLanguage) })
									: t('pollDetail.noEnd')}
					</p>
				</div>
			)}

			{turnout !== undefined && (
				<p>
					<span className="font-mono text-2xl font-semibold tabular-nums">{turnout.toLocaleString()}</span>{' '}
					<span className="text-muted-foreground">{t('pollDetail.participants')}</span>
				</p>
			)}

			{!!poll.tags?.length && (
				<ul className="flex flex-wrap gap-1.5" aria-label={t('pollDetail.topics')}>
					{poll.tags.map((tag) => (
						<li key={tag.id}>
							<Link
								href={`/?tag=${encodeURIComponent(tag.slug)}`}
								className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
							>
								#{tag.name}
							</Link>
						</li>
					))}
				</ul>
			)}

			{status !== 'ended' && (
				<p className="text-xs leading-relaxed text-muted-foreground">{t('pollDetail.sealedExplainer')}</p>
			)}

			<Button variant="outline" size="sm" className="w-full gap-2" onClick={share}>
				<Share2 className="size-4" />
				{t('pollDetail.shareCta')}
			</Button>
		</aside>
	);
}
