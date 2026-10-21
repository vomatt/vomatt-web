/**
 * @jest-environment node
 */
const revalidateTagMock = jest.fn();
jest.mock('next/cache', () => ({
	revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

import { POST } from '@/app/api/revalidate/route';
import { SYNC_TAGS_TAG } from '@/sanity/lib/live';

function request(authorization?: string, body: unknown = { syncTags: ['s1:a', 's1:b'] }) {
	return new Request('http://localhost/api/revalidate', {
		method: 'POST',
		headers: authorization ? { authorization } : {},
		body: typeof body === 'string' ? body : JSON.stringify(body),
	});
}

describe('POST /api/revalidate', () => {
	const original = process.env.SANITY_REVALIDATE_SECRET;

	beforeEach(() => {
		revalidateTagMock.mockReset();
		process.env.SANITY_REVALIDATE_SECRET = 'secret';
	});

	afterAll(() => {
		process.env.SANITY_REVALIDATE_SECRET = original;
	});

	it('expires only the changed sync tags, plus the lookup tag, immediately', async () => {
		const res = await POST(request('Bearer secret'));

		expect(res.status).toBe(200);
		expect(revalidateTagMock.mock.calls).toEqual([
			[SYNC_TAGS_TAG, { expire: 0 }],
			['sanity:s1:a', { expire: 0 }],
			['sanity:s1:b', { expire: 0 }],
		]);
	});

	it.each([
		['not JSON', 'nope'],
		['missing syncTags', {}],
		['syncTags not an array', { syncTags: 's1:a' }],
		['a non-string sync tag', { syncTags: ['s1:a', 1] }],
		['too many sync tags', { syncTags: Array.from({ length: 1001 }, (_, i) => `s1:${i}`) }],
		['an overlong sync tag', { syncTags: ['s1:' + 'a'.repeat(100)] }],
	])('rejects a body that is %s', async (_, body) => {
		const res = await POST(request('Bearer secret', body));

		expect(res.status).toBe(400);
		expect(revalidateTagMock).not.toHaveBeenCalled();
	});

	it('rejects a wrong secret', async () => {
		const res = await POST(request('Bearer nope'));

		expect(res.status).toBe(401);
		expect(revalidateTagMock).not.toHaveBeenCalled();
	});

	it('rejects a missing header', async () => {
		const res = await POST(request());

		expect(res.status).toBe(401);
		expect(revalidateTagMock).not.toHaveBeenCalled();
	});

	it('rejects every request when no secret is configured', async () => {
		delete process.env.SANITY_REVALIDATE_SECRET;

		const res = await POST(request('Bearer undefined'));

		expect(res.status).toBe(401);
		expect(revalidateTagMock).not.toHaveBeenCalled();
	});
});
