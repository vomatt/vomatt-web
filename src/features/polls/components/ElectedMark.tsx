import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type ElectedMarkProps = ComponentProps<'svg'> & {
	/** Names the mark for screen readers; without it the mark is decorative. */
	label?: string;
};

/** The red ballot stamp (a ring with a 卜 mark) that marks a winning option. Decorative unless given a label. */
export function ElectedMark({ label, className, ...props }: ElectedMarkProps) {
	return (
		<svg
			viewBox="0 0 130 130"
			{...props}
			{...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
			className={cn('shrink-0 text-elected', className)}
		>
			<circle cx="65" cy="65" r="60.3" fill="none" stroke="currentColor" strokeWidth="9.3" />
			<path d="M65 2v126M63.5 63.5 19 108" fill="none" stroke="currentColor" strokeWidth="10" />
		</svg>
	);
}

// Firefox before 125 has no Intl.Segmenter; it falls back to the first code point there
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter() : null;

/** Leading whitespace and zero-width characters, which can't hold the stamp. */
const INVISIBLE_LEAD = /^[\s\u200B-\u200D\u2060\uFEFF]*/;

/** Any invisible lead, the first character as a person sees it (an emoji or an accented letter stays whole), and the rest. */
function splitFirst(text: string): [string, string, string] {
	const lead = text.match(INVISIBLE_LEAD)![0];
	const body = text.slice(lead.length);
	const first = (segmenter ? segmenter.segment(body)[Symbol.iterator]().next().value?.segment : Array.from(body)[0]) ?? '';
	return [lead, first, body.slice(first.length)];
}

/** The ink a winning option's name is set in. */
export const WINNER_TEXT = 'font-medium text-foreground';

/**
 * A winning option's name in a meta line, in ink with the stamp before it. The sentence around it ("won", "Tie between")
 * carries the meaning, so the stamp is decorative. It is held to the name's first visible character, so a wrap never
 * strands it. Screen readers get the name whole, not split at the stamp.
 */
export function WinnerName({ name }: { name: string }) {
	const [lead, first, rest] = splitFirst(name);
	return (
		<strong className={WINNER_TEXT}>
			{/* select-none keeps a copied line from reading the name twice */}
			<span className="sr-only select-none">{name}</span>
			<span aria-hidden="true">
				{lead}
				<span className="whitespace-nowrap">
					<ElectedMark className="mr-1 inline-block size-[1em] align-[-0.125em]" />
					{first}
				</span>
				{rest}
			</span>
		</strong>
	);
}
