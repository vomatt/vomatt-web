import { Check } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BallotOutcome } from '@/features/account/insights';
import { cn } from '@/lib/utils';

import { chipClassName } from '../chip';

/** Outcomes worth a chip: the Status chip already says a Poll is Open or Ended. */
export type DecidedOutcome = Extract<BallotOutcome, 'won' | 'tied' | 'lost'>;

// A pick that won is the viewer's own: the Volt tint with an ink line, as on a cast ballot
const OUTCOME_STYLES: Record<DecidedOutcome, string> = {
	won: 'gap-1 border border-foreground bg-highlight-tint',
	tied: 'gap-1 bg-secondary',
	lost: 'bg-secondary',
};

export function isDecided(outcome: BallotOutcome): outcome is DecidedOutcome {
	return outcome in OUTCOME_STYLES;
}

/** How the viewer's Ballot fared on an Ended Poll; the words carry it, never the colour alone. */
export function OutcomeChip({ outcome }: { outcome: DecidedOutcome }) {
	const { t } = useLanguage();
	return (
		<span className={cn(chipClassName, OUTCOME_STYLES[outcome])}>
			{outcome === 'won' && <Check aria-hidden className="size-2.5" strokeWidth={3.5} />}
			{outcome === 'tied' && <span aria-hidden>=</span>}
			{t(`myPolls.outcome.${outcome}`)}
		</span>
	);
}
