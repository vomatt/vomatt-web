import { readFileSync } from 'fs';
import { join } from 'path';

import { MARK_ICONS, MARK_PATH, MARK_SLOT, markGlossIconSvg, markIconSvg, roundedPolygon } from '@/lib/brand/mark';

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

describe('roundedPolygon', () => {
	it('cuts each corner of a square to a quadratic of the given radius', () => {
		const path = roundedPolygon(
			[
				[0, 0],
				[10, 0],
				[10, 10],
				[0, 10],
			],
			2
		);
		expect(path).toBe('M2 0 L8 0 Q10 0 10 2 L10 8 Q10 10 8 10 L2 10 Q0 10 0 8 L0 2 Q0 0 2 0 Z');
	});
});

describe('glossy mark', () => {
	const svg = markGlossIconSvg({ fill: '#111111', scale: 0.5 });

	it('fills the tile square and keeps the slot a hole through every layer', () => {
		expect(svg).toContain('viewBox="-52 -52 224 224"');
		expect(svg).toContain('<rect fill="#111111" x="-52" y="-52" width="224" height="224"/>');
		expect(svg).toContain(`<mask id="m"><path fill="#ffffff" fill-rule="evenodd" d="${MARK_PATH}"/></mask>`);
		expect(svg).toContain(`<mask id="s"><path fill="#ffffff" d="${MARK_SLOT}"/></mask>`);
	});

	it('draws the three faces with rounded corners over a base tone', () => {
		const lid = svg.match(/<path fill="url\(#t\)" d="([^"]+)"/)?.[1];
		expect(lid).toMatch(/^M.* Q108\.5 32 .* Q60 60 .* Q11\.5 32 .* Q60 4 .* Z$/);
		expect(svg).toContain('<path fill="url(#l)" d="M');
		expect(svg).toContain('<path fill="url(#r)" d="M');
		expect(svg.indexOf('fill="url(#b)"')).toBeLessThan(svg.indexOf('fill="url(#t)"'));
	});
});
