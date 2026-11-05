import { readFileSync } from 'fs';
import { join } from 'path';

import { MARK_ICONS, MARK_PATH, markIconSvg } from '@/lib/brand/mark';

describe('brand mark', () => {
	it('draws box and slot as one even-odd path filling the square', () => {
		const svg = markIconSvg({ fill: '#000000' });
		expect(svg).toContain('viewBox="4 4 112 112"');
		expect(svg).toContain(`<path fill="#000000" fill-rule="evenodd" d="${MARK_PATH}"/>`);
		expect(svg).not.toContain('<style>');
	});

	it('swaps the mark fill for dark tabs when given a dark fill', () => {
		const svg = markIconSvg({ fill: '#111111', darkFill: '#eeeeee' });
		expect(svg).toContain('<style>.m{fill:#111111}@media (prefers-color-scheme: dark){.m{fill:#eeeeee}}</style>');
		expect(svg).toContain('<path class="m"');
	});

	it('centres the mark on a tile at the given scale', () => {
		const svg = markIconSvg({ fill: '#eeeeee', tile: { fill: '#111111', scale: 0.5 } });
		expect(svg).toContain('viewBox="-52 -52 224 224"');
		expect(svg).toContain('<rect fill="#111111" x="-52" y="-52" width="224" height="224"/>');
	});

	it('rounds the tile and swaps both fills in dark mode', () => {
		const svg = markIconSvg({
			fill: '#eeeeee',
			darkFill: '#111111',
			tile: { fill: '#111111', darkFill: '#eeeeee', scale: 0.5, radius: 0.25 },
		});
		expect(svg).toContain('<rect class="t" x="-52" y="-52" width="224" height="224" rx="56"/>');
		expect(svg).toContain(
			'<style>.m{fill:#eeeeee}.t{fill:#111111}@media (prefers-color-scheme: dark){.m{fill:#111111}.t{fill:#eeeeee}}</style>'
		);
	});

	it('ships the current mark as the favicon', () => {
		const shipped = readFileSync(join(process.cwd(), 'src/app/icon0.svg'), 'utf8').trim();
		expect(shipped).toBe(markIconSvg(MARK_ICONS.favicon));
	});
});
