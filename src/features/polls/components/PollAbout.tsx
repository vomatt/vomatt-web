'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Share2 } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProfileAvatar, ProfileName } from '@/features/profiles/UserChip';
import { useHydrated } from '@/hooks/useHydrated';
import { topicHref } from '@/lib/routes';

import { formatFromNow, formatPollDate } from '../format';
import { useSharePoll } from '../hooks/useSharePoll';
import type { Poll } from '../schema';
import { derivePollStatus, endedEarly, getTurnout, timelineProgress } from '../status';

/** The side panel on the detail page: who asked, the voting window, turnout and topics. */
export function PollAbout({ poll }: { poll: Poll }) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const status = derivePollStatus(poll);
	const turnout = getTurnout(poll);
	const progress = isHydrated ? timelineProgress(poll) : null;

	const share = useSharePoll();

	const statusLine = () => {
		if (status === 'ended') {
			return endedEarly(poll) && poll.deadline
				? t('pollDetail.endedEarly', { date: formatPollDate(poll.deadline, currentLanguage) })
				: t('pollDetail.resultsIn');
		}
		if (status === 'scheduled') {
			return t('poll.opensHint', { distance: formatFromNow(poll.startTime, currentLanguage) });
		}
		if (!poll.endTime) return t('pollDetail.noEnd');
		return t('pollDetail.revealsIn', { distance: formatFromNow(poll.endTime, currentLanguage) });
	};

	return (
		<aside className="space-y-5 rounded-xl border border-border bg-card p-5 text-sm md:p-6">
			<div className="flex items-center gap-3">
				<ProfileAvatar username={poll.creatorUsername} avatarUrl={poll.creatorAvatarUrl} className="size-9" />
				<div className="min-w-0">
					<p className="text-xs text-muted-foreground">{t('pollDetail.askedBy')}</p>
					<ProfileName
						username={poll.creatorUsername}
						avatarUrl={poll.creatorAvatarUrl}
						className="font-medium hover:underline"
					/>
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
								className="h-full bg-primary"
								style={{ width: `${progress}%` }}
							/>
						</div>
					)}
					<p className="font-medium">{statusLine()}</p>
				</div>
			)}

			{turnout !== undefined && (
				<p>
					<span className="font-mono text-3xl tracking-tight tabular-nums">{turnout.toLocaleString()}</span>{' '}
					<span className="text-muted-foreground">
						{t('pollDetail.participants')}
						{poll.inviteeCount != null && (
							<span className="ml-3 whitespace-nowrap">
								{t('pollDetail.invited', { count: poll.inviteeCount.toLocaleString() })}
							</span>
						)}
					</span>
				</p>
			)}

			{(poll.audience === 'unlisted' || poll.audience === 'invite-only') && (
				<p className="leading-relaxed text-muted-foreground">
					<span className="block font-medium text-foreground">{t(`poll.audience.${poll.audience}`)}</span>
					{t(`pollDetail.audience.${poll.audience}`)}
				</p>
			)}

			{!!poll.tags?.length && (
				<ul className="flex flex-wrap gap-1.5" aria-label={t('pollDetail.topics')}>
					{poll.tags.map((tag) => (
						<li key={tag.id}>
							<Link
								href={topicHref(tag.slug)}
								className="inline-flex min-h-11 items-center rounded-full md:min-h-9 bg-secondary px-3 text-[12px] text-foreground transition-colors hover:bg-border-strong"
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

			<Button variant="outline" size="sm" className="w-full gap-2" onClick={() => share(poll)}>
				<Share2 className="size-4" />
				{/* Sharing can't let anyone into an Invite-only Poll */}
				{t(poll.audience === 'invite-only' ? 'poll.share' : 'pollDetail.shareCta')}
			</Button>
		</aside>
	);
}
