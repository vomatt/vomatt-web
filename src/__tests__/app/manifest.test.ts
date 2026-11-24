import { readFileSync } from 'fs';
import { join } from 'path';

import manifest from '@/app/manifest';

/** A PNG's width and height, from its IHDR chunk. */
function pngSize(path: string) {
	const png = readFileSync(join(process.cwd(), 'public', path));
	return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
}

describe('web app manifest', () => {
	it('opens the installed app on the home feed in its own window', () => {
		expect(manifest()).toMatchObject({ name: 'vomatt', short_name: 'vomatt', start_url: '/', display: 'standalone' });
	});

	it('paints the splash and the title bar in the light page background', () => {
		const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');
		expect(css).toContain('--background: oklch(0.964 0.003 265);');
		expect(manifest()).toMatchObject({ background_color: '#f2f3f5', theme_color: '#f2f3f5' });
	});

	it('lists a 192 and a 512 icon and a 512 maskable one', () => {
		expect(manifest().icons?.map(({ sizes, purpose }) => `${sizes} ${purpose ?? 'any'}`)).toEqual([
			'192x192 any',
			'512x512 any',
			'512x512 maskable',
		]);
	});

	it('ships each icon as a PNG of the size it names', () => {
		for (const { src, sizes, type } of manifest().icons ?? []) {
			expect(type).toBe('image/png');
			expect(pngSize(src)).toBe(sizes);
		}
	});
});
