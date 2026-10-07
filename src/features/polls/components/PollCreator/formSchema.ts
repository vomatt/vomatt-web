import { z } from 'zod';

import {
	DEFAULT_VOTER_VISIBILITY,
	type Poll,
	POLL_DESCRIPTION_MAX,
	POLL_OPTION_MAX,
	POLL_OPTIONS_LIMIT,
	POLL_OPTIONS_MIN,
	type PollInput,
	POLL_TITLE_MAX,
	VoterVisibilitySchema,
} from '../../schema';

/** Error messages are translation keys. Times are `datetime-local` values. */
export const pollFormSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(1, 'pollCreator.errors.titleRequired')
			.max(POLL_TITLE_MAX, 'pollCreator.errors.titleTooLong'),
		description: z.string().max(POLL_DESCRIPTION_MAX),
		options: z
			.array(
				z.object({
					text: z
						.string()
						.trim()
						.min(1, 'pollCreator.errors.optionRequired')
						.max(POLL_OPTION_MAX),
				})
			)
			.min(POLL_OPTIONS_MIN)
			.max(POLL_OPTIONS_LIMIT),
		startTime: z.string(),
		endTime: z.string().min(1, 'pollCreator.errors.endRequired'),
		voterVisibility: VoterVisibilitySchema,
	})
	.superRefine((values, ctx) => {
		const start = values.startTime ? Date.parse(values.startTime) : Date.now();
		if (Date.parse(values.endTime) <= start) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['endTime'],
				message: 'pollCreator.errors.endBeforeStart',
			});
		}
	});

export type PollFormValues = z.input<typeof pollFormSchema>;

export const STEP_FIELDS = [
	['title', 'description'],
	['options'],
	['startTime', 'endTime', 'voterVisibility'],
] as const;

/** A Date as a `datetime-local` value in the browser's time zone. */
export function toDateTimeInput(date: Date) {
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 16);
}

export function emptyPollForm(): PollFormValues {
	return {
		title: '',
		description: '',
		options: [{ text: '' }, { text: '' }],
		startTime: '',
		endTime: toDateTimeInput(new Date(Date.now() + 3 * 24 * 3600_000)),
		voterVisibility: DEFAULT_VOTER_VISIBILITY,
	};
}

export function pollToForm(poll: Poll): PollFormValues {
	return {
		title: poll.title,
		description: poll.description ?? '',
		options: poll.options.map(({ text }) => ({ text })),
		startTime: toDateTimeInput(new Date(poll.startTime)),
		endTime: poll.endTime ? toDateTimeInput(new Date(poll.endTime)) : '',
		voterVisibility: poll.voterVisibility ?? (poll.anonymous ? 'nobody' : 'owner'),
	};
}

/** `datetime-local` values carry no offset, so convert them to full ISO strings. */
export function formToInput(values: PollFormValues): PollInput {
	const description = values.description.trim();
	return {
		title: values.title.trim(),
		description: description || undefined,
		options: values.options.map(({ text }) => ({ text: text.trim() })),
		startTime: (values.startTime ? new Date(values.startTime) : new Date()).toISOString(),
		endTime: new Date(values.endTime).toISOString(),
		voterVisibility: values.voterVisibility,
	};
}
