/**
 * The brand mark: the ballot box. A cube seen at 30°, flattened to a regular
 * hexagon with r7 corners, with the ballot slot cut into its lid as a hole.
 * Drawn on a 120-unit grid (board 16 of the logo canvas; rule in DESIGN.md
 * "Mark"). The UI shows the wordmark (`BrandLogo`); the mark is for the
 * favicon and the app icons, written by `pnpm generate:icons`.
 */

/** The box: 97 × 112 at x 11.5..108.5, y 4..116. */
export const MARK_BOX =
	'M11.5 36.04 A7 7 0 0 1 15 29.98 L56.5 6.02 A7 7 0 0 1 63.5 6.02 L105 29.98 A7 7 0 0 1 108.5 36.04 L108.5 83.96 A7 7 0 0 1 105 90.02 L63.5 113.98 A7 7 0 0 1 56.5 113.98 L15 90.02 A7 7 0 0 1 11.5 83.96 Z';

/** The slot: 40 × 14 on the lid's centre, rising 30° to the right, ends r3, 7 from the box edge. */
export const MARK_SLOT =
	'M69.76 19.37 A3 3 0 0 1 72.76 19.37 L78.88 22.9 A3 3 0 0 1 78.88 28.1 L50.24 44.63 A3 3 0 0 1 47.24 44.63 L41.12 41.1 A3 3 0 0 1 41.12 35.9 Z';

/** Box and slot as one path. Draw it with fill-rule evenodd so the slot is a hole. */
export const MARK_PATH = `${MARK_BOX} ${MARK_SLOT}`;

/** The mark is centred on (60, 60) and fills a 112-unit square edge to edge. */
export const MARK_CENTER = 60;
export const MARK_SQUARE_SIZE = 112;

/** `foreground` in the light theme (oklch 0.25 0.05 262.5). */
export const MARK_INK = '#14213a';
/** `foreground` in the dark theme (oklch 0.96 0.006 265). */
export const MARK_PAPER = '#f0f2f6';

export interface MarkTile {
	fill: string;
	/** Tile fill under `prefers-color-scheme: dark`; only an SVG can carry it. */
	darkFill?: string;
	/** The mark's height as a fraction of the tile's side. */
	scale: number;
	/** Corner radius as a fraction of the side; omit for iOS, which rounds its own. */
	radius?: number;
}

export interface MarkIconOptions {
	/** Fill of the mark. */
	fill: string;
	/** Mark fill under `prefers-color-scheme: dark`; only an SVG can carry it. */
	darkFill?: string;
	/** A square tile behind the mark, so the icon has its own ground on any tab bar. */
	tile?: MarkTile;
}

/** The tab icon: paper mark on an ink tile, swapped on dark tab bars. */
const TAB_TILE = { fill: MARK_INK, scale: 0.72, radius: 0.22 } satisfies MarkTile;

/** The icons the app ships, all drawn from the one mark. */
export const MARK_ICONS = {
	/** Browser tab, SVG: ink tile and paper mark in light, the reverse in dark. */
	favicon: { fill: MARK_PAPER, darkFill: MARK_INK, tile: { ...TAB_TILE, darkFill: MARK_PAPER } },
	/** Browser tab, favicon.ico for browsers without SVG favicons: the light version. */
	raster: { fill: MARK_PAPER, tile: TAB_TILE },
	/** iOS home screen: paper mark at 58% on an ink tile; iOS rounds the corners. */
	apple: { fill: MARK_PAPER, tile: { fill: MARK_INK, scale: 0.58 } },
} satisfies Record<string, MarkIconOptions>;

const n = (value: number) => String(Number(value.toFixed(2)));

/** An SVG document of the mark filling a square, for favicons and app icons. */
export function markIconSvg({ fill, darkFill, tile }: MarkIconOptions): string {
	const side = tile ? MARK_SQUARE_SIZE / tile.scale : MARK_SQUARE_SIZE;
	const origin = n(MARK_CENTER - side / 2);
	const viewBox = `${origin} ${origin} ${n(side)} ${n(side)}`;
	// A dark variant needs classes and a style block; a fixed icon paints inline.
	const swaps = Boolean(darkFill || tile?.darkFill);
	const paint = (cls: string, light: string) => (swaps ? `class="${cls}"` : `fill="${light}"`);
	const style = swaps
		? `<style>.m{fill:${fill}}${tile ? `.t{fill:${tile.fill}}` : ''}@media (prefers-color-scheme: dark){.m{fill:${darkFill ?? fill}}${tile ? `.t{fill:${tile.darkFill ?? tile.fill}}` : ''}}</style>`
		: '';
	const rect = tile
		? `<rect ${paint('t', tile.fill)} x="${origin}" y="${origin}" width="${n(side)}" height="${n(side)}"${tile.radius ? ` rx="${n(side * tile.radius)}"` : ''}/>`
		: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${style}${rect}<path ${paint('m', fill)} fill-rule="evenodd" d="${MARK_PATH}"/></svg>`;
}
