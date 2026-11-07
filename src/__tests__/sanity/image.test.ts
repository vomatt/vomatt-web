jest.mock('@/sanity/env', () => ({ projectId: 'proj', dataset: 'prod' }));

import { buildShareImageUrl } from '@/sanity/lib/image';

const image = { asset: { _ref: 'image-abc123-2000x1000-jpg' } };

describe('buildShareImageUrl', () => {
	it('builds a 1200px webp url', () => {
		const url = buildShareImageUrl(image);

		expect(url).toContain('w=1200');
		expect(url).toContain('fm=webp');
	});
});

describe('imageBuilder', () => {
	it('is made without the deprecated default export, which warns on every page', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		jest.isolateModules(() => {
			require('@/sanity/lib/image');
		});
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});
});
