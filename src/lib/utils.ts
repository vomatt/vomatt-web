import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The type scale in global.css; without it twMerge reads text-caption-2 as a color and drops it beside text-muted-foreground
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			text: [(value: string) => /^(display|title|body|caption)-\d$/.test(value)],
			tracking: ['title', 'label'],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** The text in a wrapping row beside a button: it shares the line while it has 14rem, otherwise the button drops below it. */
export const wrapRowText = 'min-w-0 grow basis-56';
