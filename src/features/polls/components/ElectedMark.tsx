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
			{...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
			{...props}
			className={cn('shrink-0 text-elected', className)}
		>
			<circle cx="65" cy="65" r="60.3" fill="none" stroke="currentColor" strokeWidth="9.3" />
			<path d="M65 2v126M63.5 63.5 19 108" fill="none" stroke="currentColor" strokeWidth="10" />
		</svg>
	);
}

/** The first character as a person sees it (an emoji or an accented letter stays whole), and the rest. */
function splitFirst(text: string): [string, string] {
	const first = new Intl.Segmenter().segment(text)[Symbol.iterator]().next().value?.segment ?? '';
	return [first, text.slice(first.length)];
}

/**
 * A winning option's name in a meta line, in ink with the stamp before it. The sentence around it ("won", "Tie between")
 * carries the meaning, so the stamp is decorative. It is held to the name's first character, so a wrap never strands it.
 */
export function WinnerName({ name }: { name: string }) {
	const [first, rest] = splitFirst(name);
	return (
		<strong className="font-medium text-foreground">
			<span className="whitespace-nowrap">
				<ElectedMark className="mr-1 inline-block size-[1em] align-[-0.125em]" />
				{first}
			</span>
			{rest}
		</strong>
	);
}
