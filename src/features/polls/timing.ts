import type { Translate } from '@/lib/count';
import type { LanguageCode } from '@/types';

import { formatDuration, formatPollDay, formatPollMoment } from './format';
import type { Poll } from './schema';
import type { PollStatus } from './status';

/** What a poll surface needs to say about time: the viewer's now, language and strings. */
export type ViewerClock = { now: number; language: LanguageCode; t: Translate };

/** Every way a poll surface says when. Derived; never stored. */
export type PollTiming = {
	/** A chip that stands alone: "Opens Mon 9:00", "Open · ends Fri", "Ends in 6h", "Ended Mon". */
	chip: string;
	/**
	 * The time for a meta line beside a status-word chip, lower-case mid-sentence: "ends Fri 20:00",
	 * "ends in 6h"; a Scheduled poll's "Opens Mon 9:00" stands alone. Null once ended (the meta
	 * says the outcome) and for an Open poll without an end.
	 */
	when: string | null;
};

/** The chip's word for a status: Soon / Open / Closing / Ended. Needs no clock. */
export function statusWord(status: PollStatus, t: Translate) {
	return t(`poll.status.${status}`);
}

export function pollTiming(
	poll: Pick<Poll, 'startTime' | 'endTime'>,
	status: PollStatus,
	{ now, language, t }: ViewerClock
): PollTiming {
	const { startTime, endTime } = poll;
	if (status === 'scheduled') {
		const opens = t('poll.chipOpens', { date: formatPollMoment(startTime, language, now) });
		return { chip: opens, when: opens };
	}
	if (status === 'ended') {
		const chip = endTime
			? t('poll.chipEnded', { day: formatPollDay(endTime, language, now) })
			: statusWord(status, t);
		return { chip, when: null };
	}
	if (!endTime) return { chip: statusWord('open', t), when: null };
	if (status === 'closing') {
		const duration = formatDuration(Date.parse(endTime) - now, language);
		return { chip: t('poll.chipEndsIn', { duration }), when: t('poll.endsIn', { duration }) };
	}
	return {
		chip: t('poll.chipOpenEnds', { day: formatPollDay(endTime, language, now) }),
		when: t('profile.endsAt', { date: formatPollMoment(endTime, language, now) }),
	};
}
