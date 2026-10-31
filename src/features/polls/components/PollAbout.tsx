'use client';

import Link from 'next/link';
import { useId } from 'react';

import { Progress } from '@/components/ui/Progress';
import { Eye, Lock, User } from '@/components/ui/SvgIcons';
import { TideRule, TideRules } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { topicHref } from '@/lib/routes';

import { formatPollDate } from '../format';
import type { Poll } from '../schema';
import { derivePollStatus, endedEarly, timelineProgress, visibilityLevel } from '../status';

/** The rail card on the poll page: the voting window, the rules and topics; once Ended, one line. */
export function PollAbout({ poll }: { poll: Poll }) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const headingId = useId();
	const status = derivePollStatus(poll);
	const progress = isHydrated ? timelineProgress(poll) : null;
	const level = visibilityLevel(poll);

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
			<h2 id={headingId} className="text-caption-1 font-semibold uppercase tracking-label text-muted-foreground">
				{t('pollDetail.about')}
			</h2>

			{status === 'ended' ? (
				endedEarly(poll) && poll.deadline ? (
					// The date is in the viewer's time zone, so it waits for hydration
					isHydrated && (
						<p className="text-body-4">
							{t('pollDetail.endedEarly', { date: formatPollDate(poll.deadline, currentLanguage) })}
						</p>
					)
				) : (
					<p className="text-body-4">{t('pollDetail.resultsIn')}</p>
				)
			) : (
				<>
					{isHydrated && (
						<div className="flex flex-col gap-2 text-caption-1">
							<p className="flex justify-between gap-3">
								<span className="text-muted-foreground">
									{t(status === 'scheduled' ? 'pollDetail.opens' : 'pollDetail.opened')}
								</span>
								<span>{formatPollDate(poll.startTime, currentLanguage)}</span>
							</p>
							{progress !== null && (
								<Progress
									variant="tide"
									value={Math.round(progress)}
									aria-label={t('pollDetail.timeline')}
									className="h-1.5"
								/>
							)}
							<p className="flex justify-between gap-3">
								<span className="text-muted-foreground">{t('pollDetail.results')}</span>
								<span>
									{poll.endTime ? formatPollDate(poll.endTime, currentLanguage) : t('pollDetail.noEnd')}
								</span>
							</p>
						</div>
					)}

					<TideRules>
						<TideRule icon={Lock}>{t('pollDetail.ruleSealed')}</TideRule>
						<TideRule icon={User}>{t('pollDetail.ruleOneVote')}</TideRule>
						{level && <TideRule icon={Eye}>{t(`poll.visibility.${level}`)}</TideRule>}
					</TideRules>

					{!!poll.tags?.length && (
						// Phones space the rows so each chip's 44px hit area stays its own
						<ul className="flex flex-wrap gap-x-1.5 gap-y-4 md:gap-y-1.5" aria-label={t('pollDetail.topics')}>
							{poll.tags.map((tag) => (
								<li key={tag.id}>
									<Link
										href={topicHref(tag.slug)}
										className="relative inline-flex items-center rounded-full bg-field px-2.5 py-[5px] text-caption-2 leading-normal font-medium text-foreground transition-colors outline-none before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] hover:bg-border-strong focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring md:before:hidden"
									>
										{tag.name}
									</Link>
								</li>
							))}
						</ul>
					)}
				</>
			)}
		</section>
	);
}
