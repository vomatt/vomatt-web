import { readFileSync } from 'fs';
import path from 'path';

import { cn } from '@/lib/utils';

const css = readFileSync(path.join(__dirname, '../../styles/global.css'), 'utf8');
const steps = [...css.matchAll(/^\t--text-([a-z]+-\d):/gm)].map((match) => match[1]);
const trackings = [...css.matchAll(/^\t--tracking-([a-z]+):/gm)].map((match) => match[1]);

describe('type scale', () => {
	it('defines its steps in global.css', () => {
		expect(steps).toEqual(expect.arrayContaining(['display-1', 'title-4', 'body-1', 'caption-4']));
	});

	it.each(steps)('cn keeps text-%s beside a text color', (step) => {
		expect(cn(`text-${step}`, 'text-muted-foreground')).toBe(`text-${step} text-muted-foreground`);
	});

	it.each(steps)('cn lets a later step replace text-%s', (step) => {
		expect(cn(`text-${step}`, 'text-caption-2')).toBe('text-caption-2');
	});

	it.each(trackings)('cn treats tracking-%s as tracking', (tracking) => {
		expect(cn(`tracking-${tracking}`, 'text-muted-foreground', 'tracking-normal')).toBe('text-muted-foreground tracking-normal');
	});

	it('keeps raw sizes out of @apply, which ESLint does not see', () => {
		const offenders = css
			.split('\n')
			.filter((line) => /@apply/.test(line))
			.filter((line) => /(^|[\s:!])(text-(\[|\(length:)|(leading|tracking)-[[(]|text-(xs|sm|base|lg|[2-9]?xl)(?![\w-]))/.test(line))
			.map((line) => line.trim());
		expect(offenders).toEqual([]);
	});
});
