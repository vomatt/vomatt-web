import { readFileSync } from 'fs';
import { join } from 'path';

import {
	APPLE_TILE,
	MARK_ICONS,
	MARK_PATH,
	MARK_SLOT,
	markGlossIconSvg,
	markIconSvg,
	markLoaderSvg,
	roundedPolygon,
} from '@/lib/brand/mark';

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

describe('loader', () => {
	const ids = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
	const references = (svg: string) => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
	const parse = (svg: string) => new DOMParser().parseFromString(svg, 'image/svg+xml');
	const numbers = (text: string) => text.match(/-?\d+(\.\d+)?/g)!.map(Number);

	it('leaves the iOS icon without a ballot', () => {
		expect(markGlossIconSvg(APPLE_TILE)).not.toContain('mark-ballot');
	});

	it('rounds its tile', () => {
		expect(markLoaderSvg('x-')).toMatch(/<rect fill="#14213a" [^>]* rx="42\.48"\/>/);
	});

	it('prefixes every id and points every reference at one of them', () => {
		const svg = markLoaderSvg('x-');
		expect(ids(svg).length).toBeGreaterThan(0);
		for (const id of ids(svg)) expect(id).toMatch(/^x-/);
		expect(references(svg).length).toBeGreaterThan(0);
		for (const ref of references(svg)) expect(ids(svg)).toContain(ref);
	});

	it('stands the ballot on the slot, along its 30° rise', () => {
		const doc = parse(markLoaderSvg('x-'));
		expect(doc.querySelector('parsererror')).toBeNull();
		const [lx, ly, rx, ry] = numbers(doc.querySelector('.mark-ballot')!.getAttribute('d')!);
		// The slot's straight sides start at its M and L points; their average is its centre
		const ends = [...MARK_SLOT.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
		const centre = [ends.reduce((a, [x]) => a + x, 0) / ends.length, ends.reduce((a, [, y]) => a + y, 0) / ends.length];
		expect((lx + rx) / 2).toBeCloseTo(centre[0], 1);
		expect((ly + ry) / 2).toBeCloseTo(centre[1], 1);
		expect(Math.atan2(ly - ry, rx - lx)).toBeCloseTo(Math.PI / 6, 3);
	});
});
