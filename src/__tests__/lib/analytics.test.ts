import { trackEvent } from '@/lib/analytics';

const mockTrack = jest.fn();
jest.mock('@vercel/analytics', () => ({ track: (...args: unknown[]) => mockTrack(...args) }));

it('sends a product event to Vercel Analytics under its name with its props', () => {
	trackEvent('vote_cast', { change: true });
	trackEvent('upgrade_clicked', {});
	expect(mockTrack.mock.calls).toEqual([
		['vote_cast', { change: true }],
		['upgrade_clicked', {}],
	]);
});

it('takes only registered events with their own props', () => {
	// @ts-expect-error not a registered event
	trackEvent('page_viewed', {});
	// @ts-expect-error a poll id is not part of the event
	trackEvent('vote_cast', { change: false, pollId: 'poll-1' });
	// @ts-expect-error QR, LINE, NATIVE and COPY_LINK are the channels
	trackEvent('poll_shared', { channel: 'FAX' });
});
