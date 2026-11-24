/**
 * @jest-environment node
 */
import Image from '@/app/(frontend)/poll/[id]/opengraph-image';
import { toShortId } from '@/features/polls/shortId';

const mockGetPoll = jest.fn();
jest.mock('@/features/polls/service', () => ({ getPoll: (...args: unknown[]) => mockGetPoll(...args) }));
jest.mock('next/og', () => ({ ImageResponse: class {} }));

const POLL_ID = '0199f2a3-5b7e-7d40-a1c8-9e3b2f6d4c05';

beforeEach(() => {
	mockGetPoll.mockReset().mockResolvedValue(null);
	global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
});

describe('poll share image', () => {
	it.each([
		['the short id', toShortId(POLL_ID)],
		['the full UUID an unfurler cached before short links', POLL_ID],
	])('draws the Poll for a link by %s', async (_, param) => {
		await Image({ params: Promise.resolve({ id: param }) });
		expect(mockGetPoll).toHaveBeenCalledWith(POLL_ID);
	});

	it('draws the brand card without asking the API for an id that is neither', async () => {
		await Image({ params: Promise.resolve({ id: 'not-a-poll' }) });
		expect(mockGetPoll).not.toHaveBeenCalled();
	});
});
