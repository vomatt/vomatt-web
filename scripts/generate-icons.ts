/**
 * Writes the favicon and app icons from the brand mark in src/lib/brand/mark.ts.
 *
 * Usage:
 *   pnpm generate:icons
 *
 * Overwrites src/app/icon0.svg, favicon.ico and apple-icon.png. Next.js turns
 * those files into the <link rel="icon"> and apple-touch-icon tags.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

import sharp from 'sharp';

import { packIco } from '../src/lib/brand/ico';
import { MARK_ICONS, markIconSvg } from '../src/lib/brand/mark';

const appDir = join(__dirname, '..', 'src', 'app');
const ICO_SIZES = [16, 32, 48];

/** Rasterises an SVG once at `size` px; the viewBox is scaled to fit. */
function rasterise(svg: string, size: number) {
	return sharp(Buffer.from(svg), { density: 600 }).resize(size, size);
}

async function main() {
	writeFileSync(join(appDir, 'icon0.svg'), `${markIconSvg(MARK_ICONS.favicon)}\n`);

	// One render of the tab icon, sized down for each ICO entry.
	const tab = await rasterise(markIconSvg(MARK_ICONS.raster), 512).png().toBuffer();
	const entries = await Promise.all(
		ICO_SIZES.map(async (size) => ({ size, data: await sharp(tab).resize(size, size).png().toBuffer() }))
	);
	writeFileSync(join(appDir, 'favicon.ico'), packIco(entries));

	// iOS wants an opaque icon: the tile fills the square, so drop the alpha channel.
	writeFileSync(
		join(appDir, 'apple-icon.png'),
		await rasterise(markIconSvg(MARK_ICONS.apple), 180).removeAlpha().png().toBuffer()
	);
	console.log('Wrote icon0.svg, favicon.ico and apple-icon.png to src/app');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
