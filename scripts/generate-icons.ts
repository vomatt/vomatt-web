/**
 * Writes the favicon and app icons from the brand mark in src/lib/brand/mark.ts.
 *
 * Usage:
 *   pnpm generate:icons
 *
 * Overwrites src/app/icon0.svg, favicon.ico and apple-icon.png. Next.js turns
 * those files into the <link rel="icon"> and apple-touch-icon tags. Also overwrites
 * the installed-app icons in public/ that src/app/manifest.ts lists.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

import sharp from 'sharp';

import { packIco } from '../src/lib/brand/ico';
import { APP_TILE, APPLE_TILE, MARK_ICONS, MASKABLE_TILE, markGlossIconSvg, markIconSvg } from '../src/lib/brand/mark';

const appDir = join(__dirname, '..', 'src', 'app');
const publicDir = join(__dirname, '..', 'public');
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
		await rasterise(markGlossIconSvg(APPLE_TILE), 180).removeAlpha().png().toBuffer()
	);

	const app = markGlossIconSvg(APP_TILE);
	for (const size of [192, 512]) {
		writeFileSync(join(publicDir, `icon-${size}.png`), await rasterise(app, size).png().toBuffer());
	}
	// A maskable icon is cut to the launcher's shape, so its tile is opaque to every edge.
	writeFileSync(
		join(publicDir, 'icon-maskable-512.png'),
		await rasterise(markGlossIconSvg(MASKABLE_TILE), 512).removeAlpha().png().toBuffer()
	);
	console.log('Wrote icon0.svg, favicon.ico and apple-icon.png to src/app, and the installed-app icons to public');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
