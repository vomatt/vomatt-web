jest.mock('@/sanity/env', () => ({ projectId: 'proj', dataset: 'prod' }));

import { buildImageSrc, buildShareImageUrl } from '@/sanity/lib/image';

const image = { asset: { _ref: 'image-abc123-2000x1000-jpg' } };

describe('buildImageSrc', () => {
	it('returns undefined when there is no image', () => {
		expect(buildImageSrc(undefined, {})).toBeUndefined();
	});

	it('builds a CDN url with size, quality and fit', () => {
		const url = buildImageSrc(image, { width: 400.4, height: 200 });

		expect(url).toContain('https://cdn.sanity.io/images/proj/prod/abc123-2000x1000.jpg');
		expect(url).toContain('w=400');
		expect(url).toContain('h=200');
		expect(url).toContain('q=80');
		expect(url).toContain('fit=max');
	});
});

describe('buildShareImageUrl', () => {
	it('builds a 1200px webp url', () => {
		const url = buildShareImageUrl(image);

		expect(url).toContain('w=1200');
		expect(url).toContain('fm=webp');
	});
});
