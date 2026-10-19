import { useLanguage } from '@/contexts/LanguageContext';
import type { BallotOutcome } from '@/features/account/insights';
import { cn } from '@/lib/utils';

import { chipClassName } from '../chip';

/** Outcomes worth a chip: the Status chip already says a Poll is Open or Ended. */
export type DecidedOutcome = Extract<BallotOutcome, 'won' | 'tied' | 'lost'>;

const OUTCOME_STYLES: Record<DecidedOutcome, string> = {
	won: 'bg-status-open',
	tied: 'bg-status-closing',
	lost: 'bg-secondary',
};

export function isDecided(outcome: BallotOutcome): outcome is DecidedOutcome {
	return outcome in OUTCOME_STYLES;
}

/** How the viewer's Ballot fared on an Ended Poll. */
export function OutcomeChip({ outcome }: { outcome: DecidedOutcome }) {
	const { t } = useLanguage();
	return <span className={cn(chipClassName, OUTCOME_STYLES[outcome])}>{t(`myPolls.outcome.${outcome}`)}</span>;
}
