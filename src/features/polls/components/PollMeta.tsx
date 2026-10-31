'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { endedSummary } from '@/features/profiles/lists';
import { toPayloadLocale } from '@/lib/locale';
import { rich, richList } from '@/lib/rich';

import type { Poll } from '../schema';
import { getTurnout, isCancelled } from '../status';

export function useVotedText() {
	const { t, currentLanguage } = useLanguage();
	return (poll: Poll) => {
		const turnout = (getTurnout(poll) ?? 0).toLocaleString(toPayloadLocale(currentLanguage));
		return t('poll.voted', { count: turnout });
	};
}

/** What an Ended Poll decided, "**Yes** won" or "Tie between **A** and **B**"; nothing when there is no winner to name. */
function DecidedText({ poll }: { poll: Poll }) {
	const { t, currentLanguage } = useLanguage();
	const summary = endedSummary(poll);
	const strong = (text: string) => <strong className="font-medium text-foreground">{text}</strong>;
	if (summary.kind === 'won') return rich(t('profile.wonBy'), { option: strong(summary.winner) });
	if (summary.kind === 'tie') {
		return rich(t('profile.tieBetween'), { options: richList(summary.winners, toPayloadLocale(currentLanguage), strong) });
	}
	return null;
}

/** "**Yes** won · 2,061 voted", "Tie between **A** and **B** · 88 voted", or the turnout alone. */
export function EndedMeta({ poll }: { poll: Poll }) {
	const { t } = useLanguage();
	if (isCancelled(poll)) return <>{t('notifications.cancelled')}</>;
	return (
		<>
			{endedSummary(poll).kind !== 'none' && (
				<>
					<DecidedText poll={poll} /> ·{' '}
				</>
			)}
			<Turnout poll={poll} />
		</>
	);
}

/** "1,284 voted" in mono, as every poll meta line sets the turnout. */
export function Turnout({ poll }: { poll: Poll }) {
	const voted = useVotedText();
	return <span className="tabular-nums">{voted(poll)}</span>;
}
