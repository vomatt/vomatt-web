import type { Poll } from './schema';

/** The link preview text: the Poll's context, then its options. */
export function shareDescription(poll: Pick<Poll, 'description' | 'options'>): string {
	const options = poll.options.map((option) => option.text).join(' / ');
	const context = poll.description?.trim();
	return context ? `${context}\n${options}` : options;
}
