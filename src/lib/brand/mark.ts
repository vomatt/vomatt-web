/**
 * The brand mark: the ballot box. A cube seen at 30°, flattened to a regular
 * hexagon with r7 corners, with the ballot slot cut into its lid as a hole.
 * Drawn on a 120-unit grid (board 16 of the logo canvas; rule in DESIGN.md
 * "Mark"). The UI shows the wordmark (`BrandLogo`); the mark is for the
 * favicon and the app icons, written by `pnpm generate:icons`, and the
 * first-load loader (`MarkLoader`).
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
} satisfies Record<string, MarkIconOptions>;

/** iOS home screen: the glossy silver mark at 58% on an ink tile; iOS rounds the corners. */
export const APPLE_TILE = { fill: MARK_INK, scale: 0.58 } satisfies MarkTile;

const n = (value: number) => String(Number(value.toFixed(2)));

/** The square the icon fills: the mark's own, or the tile's at its scale. */
function square(tile?: MarkTile) {
	const side = tile ? MARK_SQUARE_SIZE / tile.scale : MARK_SQUARE_SIZE;
	const origin = n(MARK_CENTER - side / 2);
	return { origin, side: n(side), viewBox: `${origin} ${origin} ${n(side)} ${n(side)}` };
}

/** An SVG document of the mark filling a square, for favicons and app icons. */
export function markIconSvg({ fill, darkFill, tile }: MarkIconOptions): string {
	const { origin, side, viewBox } = square(tile);
	// A dark variant needs classes and a style block; a fixed icon paints inline.
	const swaps = Boolean(darkFill || tile?.darkFill);
	const paint = (cls: string, light: string) => (swaps ? `class="${cls}"` : `fill="${light}"`);
	const style = swaps
		? `<style>.m{fill:${fill}}${tile ? `.t{fill:${tile.fill}}` : ''}@media (prefers-color-scheme: dark){.m{fill:${darkFill ?? fill}}${tile ? `.t{fill:${tile.darkFill ?? tile.fill}}` : ''}}</style>`
		: '';
	const rect = tile
		? `<rect ${paint('t', tile.fill)} x="${origin}" y="${origin}" width="${side}" height="${side}"${tile.radius ? ` rx="${n(Number(side) * tile.radius)}"` : ''}/>`
		: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${style}${rect}<path ${paint('m', fill)} fill-rule="evenodd" d="${MARK_PATH}"/></svg>`;
}

type Point = [number, number];

/** The cube's three faces on the 120 grid: the lid, then the left and right sides. */
const LID: Point[] = [
	[60, 4],
	[108.5, 32],
	[60, 60],
	[11.5, 32],
];
const LEFT_FACE: Point[] = [
	[11.5, 32],
	[60, 60],
	[60, 116],
	[11.5, 88],
];
const RIGHT_FACE: Point[] = [
	[108.5, 32],
	[108.5, 88],
	[60, 116],
	[60, 60],
];
/** Each face's corners are rounded by this, so no seam ends in a sharp notch against the box's r7. */
const FACE_RADIUS = 5.5;

/** A polygon as a path with its corners rounded to `radius` (a quadratic per corner). */
export function roundedPolygon(points: Point[], radius: number): string {
	const corners = points.map(([x, y], i) => {
		const [ax, ay] = points[(i + points.length - 1) % points.length];
		const [bx, by] = points[(i + 1) % points.length];
		const la = Math.hypot(ax - x, ay - y);
		const lb = Math.hypot(bx - x, by - y);
		const [uax, uay] = [(ax - x) / la, (ay - y) / la];
		const [ubx, uby] = [(bx - x) / lb, (by - y) / lb];
		const angle = Math.acos(uax * ubx + uay * uby);
		const d = radius / Math.tan(angle / 2);
		const to = `${n(x + ubx * d)} ${n(y + uby * d)}`;
		return { from: `${n(x + uax * d)} ${n(y + uay * d)}`, to, corner: `Q${n(x)} ${n(y)} ${to}` };
	});
	const first = corners[0];
	const rest = corners
		.slice(1)
		.concat(first)
		.map((c) => `L${c.from} ${c.corner}`)
		.join(' ');
	return `M${first.to} ${rest} Z`;
}

/** The lid's far shade, also the edge of the loader's paper ballot. */
const LID_SHADE = '#c9cdd4';

/**
 * The glossy silver mark (board 18 of the logo canvas, G1), its ids prefixed with `p`. The
 * three faces are rounded shapes over a base tone, each seam catches a line of light, the lid
 * a highlight, the box a lit rim; the slot stays a hole, shadowed at its upper lip. `box` is
 * drawn under the drop shadow `url(#<p>d)`. Only where there are pixels to spare: the
 * favicon and the rest of the UI keep the flat mark.
 */
function glossMark(p: string) {
	const lid = roundedPolygon(LID, FACE_RADIUS);
	const left = roundedPolygon(LEFT_FACE, FACE_RADIUS);
	const right = roundedPolygon(RIGHT_FACE, FACE_RADIUS);
	const stops = (...list: [string, string, number?][]) =>
		list
			.map(([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}"${opacity === undefined ? '' : ` stop-opacity="${opacity}"`}/>`)
			.join('');
	const defs =
		`<mask id="${p}m"><path fill="#ffffff" fill-rule="evenodd" d="${MARK_PATH}"/></mask>` +
		`<mask id="${p}s"><path fill="#ffffff" d="${MARK_SLOT}"/></mask>` +
		`<clipPath id="${p}c"><path d="${lid}"/></clipPath>` +
		`<linearGradient id="${p}b" x2="0" y2="1">${stops(['0', '#e3e6ea'], ['1', '#555a63'])}</linearGradient>` +
		`<linearGradient id="${p}t" x2="1" y2="1">${stops(['0', '#ffffff'], ['1', LID_SHADE])}</linearGradient>` +
		`<linearGradient id="${p}l" x2="0" y2="1">${stops(['0', '#c8ccd3'], ['1', '#7a7f88'])}</linearGradient>` +
		`<linearGradient id="${p}r" x2="0" y2="1">${stops(['0', '#7b8089'], ['1', '#33383f'])}</linearGradient>` +
		`<linearGradient id="${p}v" x2="0" y2="1">${stops(['0', '#ffffff', 0.2], ['0.55', '#ffffff', 0], ['0.55', '#000000', 0], ['1', '#000000', 0.22])}</linearGradient>` +
		`<linearGradient id="${p}e" x2="1" y2="1">${stops(['0', '#ffffff', 0.95], ['0.6', '#ffffff', 0.12], ['1', '#ffffff', 0])}</linearGradient>` +
		`<radialGradient id="${p}p">${stops(['0', '#ffffff', 0.75], ['1', '#ffffff', 0])}</radialGradient>` +
		`<linearGradient id="${p}h" gradientUnits="userSpaceOnUse" x1="56.5" y1="25.94" x2="63.5" y2="38.06">${stops(['0', '#000000', 0.6], ['0.5', '#000000', 0], ['0.78', '#ffffff', 0], ['1', '#ffffff', 0.6])}</linearGradient>` +
		`<filter id="${p}g"><feGaussianBlur stdDeviation="0.9"/></filter>` +
		`<filter id="${p}d" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/></filter>`;
	const box =
		`<g mask="url(#${p}m)">` +
		`<path fill="url(#${p}b)" d="${MARK_BOX}"/>` +
		`<path fill="url(#${p}t)" d="${lid}"/><path fill="url(#${p}l)" d="${left}"/><path fill="url(#${p}r)" d="${right}"/>` +
		`<path fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.6" stroke-linecap="round" filter="url(#${p}g)" d="M11.5 32L60 60L108.5 32M60 60V116"/>` +
		`<path fill="url(#${p}v)" d="${MARK_BOX}"/>` +
		`<g clip-path="url(#${p}c)"><ellipse cx="40" cy="22" rx="22" ry="7" transform="rotate(-30 40 22)" fill="url(#${p}p)"/></g>` +
		`<path fill="none" stroke="url(#${p}e)" stroke-width="2" d="${MARK_BOX}"/>` +
		`</g>` +
		`<rect x="36" y="16" width="48" height="32" fill="url(#${p}h)" mask="url(#${p}s)"/>`;
	return { defs, box };
}

/** An SVG document of the glossy silver mark on a tile, for the iOS icon. */
export function markGlossIconSvg(tile: MarkTile): string {
	const { origin, side, viewBox } = square(tile);
	const { defs, box } = glossMark('');
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><defs>${defs}</defs>` +
		`<rect fill="${tile.fill}" x="${origin}" y="${origin}" width="${side}" height="${side}"/>` +
		`<g filter="url(#d)">${box}</g></svg>`
	);
}

/** The slot's centre line runs through the lid's centre, rising 30° to the right (see MARK_SLOT). */
export const SLOT_CENTRE: Point = [(LID[0][0] + LID[2][0]) / 2, (LID[0][1] + LID[2][1]) / 2];
const SLOT_RISE = Math.PI / 6;
/** The loader's ballot card: narrower than the slot's 40 so it clears the rounded ends. */
const BALLOT_WIDTH = 28;
const BALLOT_HEIGHT = 34;

/** The ballot standing in the slot, and the half-plane above the slot's centre line it is clipped to. */
function ballotGeometry() {
	const [cx, cy] = SLOT_CENTRE;
	const [ux, uy] = [Math.cos(SLOT_RISE), -Math.sin(SLOT_RISE)];
	const half = BALLOT_WIDTH / 2;
	const [lx, ly, rx, ry] = [cx - ux * half, cy - uy * half, cx + ux * half, cy + uy * half];
	const card = `M${n(lx)} ${n(ly)} L${n(rx)} ${n(ry)} L${n(rx)} ${n(ry - BALLOT_HEIGHT)} L${n(lx)} ${n(ly - BALLOT_HEIGHT)} Z`;
	// Past the loader tile (about -37..157) on every side, so only the slot's line cuts the card
	const lineY = (x: number) => cy + (uy / ux) * (x - cx);
	const aboveSlot = `-40 -40 160 -40 160 ${n(lineY(160))} -40 ${n(lineY(-40))}`;
	return { card, aboveSlot };
}

/** The first-load loader: the glossy mark at 58% on a rounded ink tile, like the home screen icon. */
export const LOADER_TILE = { fill: MARK_INK, scale: 0.58, radius: 0.22 } satisfies MarkTile;

/**
 * The loader's SVG: the glossy mark on its tile with a paper ballot standing in the slot
 * (`.mark-ballot`, which `animate-ballot-drop` in global.css drops), clipped above the slot's
 * centre line so it vanishes inside. `idPrefix` keeps each inline copy's ids its own.
 */
export function markLoaderSvg(idPrefix: string): string {
	const p = idPrefix;
	const { origin, side, viewBox } = square(LOADER_TILE);
	const { defs, box } = glossMark(p);
	const { card, aboveSlot } = ballotGeometry();
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` +
		`<defs>${defs}<clipPath id="${p}k"><polygon points="${aboveSlot}"/></clipPath></defs>` +
		`<rect fill="${LOADER_TILE.fill}" x="${origin}" y="${origin}" width="${side}" height="${side}" rx="${n(Number(side) * LOADER_TILE.radius)}"/>` +
		`<g filter="url(#${p}d)">${box}` +
		`<g clip-path="url(#${p}k)"><path class="mark-ballot" fill="${MARK_PAPER}" stroke="${LID_SHADE}" stroke-width="1" d="${card}"/></g>` +
		`</g></svg>`
	);
}
