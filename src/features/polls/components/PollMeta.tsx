'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { endedSummary } from '@/features/profiles/lists';
import { toLocaleTag } from '@/lib/locale';
import { rich, richList } from '@/lib/rich';
import { META_GAP } from '@/lib/rich';

import type { Poll } from '../schema';
import { getTurnout, isCancelled } from '../status';
import { WINNER_TEXT, WinnerName } from './ElectedMark';

export function useVotedText() {
	const { t, currentLanguage } = useLanguage();
	return (poll: Poll) => {
		const turnout = (getTurnout(poll) ?? 0).toLocaleString(toLocaleTag(currentLanguage));
		return t('poll.voted', { count: turnout });
	};
}

/**
 * What an Ended Poll decided, "**Yes** won" or "Tie between **A** and **B**"; nothing without winners.
 * `shortTie` sets a tie as a bare "Tie", where there is no room to name every winner.
 */
export function DecidedText({ winners, tie, shortTie }: { winners: string[]; tie: boolean; shortTie?: boolean }) {
	const { t, currentLanguage } = useLanguage();
	const winner = (name: string) => <WinnerName name={name} />;
	if (!winners.length) return null;
	if (!tie) return rich(t('profile.wonBy'), { option: winner(winners[0]) });
	if (shortTie) return <strong className={WINNER_TEXT}>{t('homePage.resultsTie')}</strong>;
	return rich(t('profile.tieBetween'), { options: richList(winners, toLocaleTag(currentLanguage), winner) });
}

/** The winners of an Ended Poll as DecidedText takes them; null when there is no winner to name. */
export function decidedWinners(poll: Poll): { winners: string[]; tie: boolean } | null {
	const summary = endedSummary(poll);
	if (summary.kind === 'won') return { winners: [summary.winner], tie: false };
	if (summary.kind === 'tie') return { winners: summary.winners, tie: true };
	return null;
}

/** "**Yes** won" + gap + "2,061 voted", "Tie between **A** and **B**" + gap + "88 voted", or the turnout alone. */
export function EndedMeta({ poll }: { poll: Poll }) {
	const { t } = useLanguage();
	if (isCancelled(poll)) return <>{t('notifications.cancelled')}</>;
	const decided = decidedWinners(poll);
	return (
		<>
			{decided && (
				<>
					<DecidedText {...decided} />{META_GAP}
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
