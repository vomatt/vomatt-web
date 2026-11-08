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
