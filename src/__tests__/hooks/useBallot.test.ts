import { act, renderHook, waitFor } from '@testing-library/react';

import { useBallot } from '@/features/polls/hooks/useBallot';
import type { Poll } from '@/features/polls/schema';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }));

const mockCastBallot = jest.fn();
const mockRetractBallot = jest.fn();
jest.mock('@/features/polls/service', () => ({
	castBallot: (...args: unknown[]) => mockCastBallot(...args),
	retractBallot: (...args: unknown[]) => mockRetractBallot(...args),
	getMyBallot: jest.fn().mockResolvedValue(null),
}));

const poll = {
	id: 'poll-1',
	options: [{ id: 'opt-a', text: 'A' }],
	myOptionId: null,
} as unknown as Poll;

const setup = () =>
	renderHook(() => useBallot(poll, { isAuthed: true, onPollEnded: jest.fn() }));

describe('useBallot outcomes', () => {
	beforeEach(() => jest.clearAllMocks());

	it('resolves saved when the API accepts the cast', async () => {
		mockCastBallot.mockResolvedValue({ ok: true });
		const { result } = setup();
		let outcome: string | undefined;
		await act(async () => {
			outcome = await result.current.cast('opt-a');
		});
		expect(outcome).toBe('saved');
		expect(result.current.myOptionId).toBe('opt-a');
	});

	it('resolves failed and rolls back on an error', async () => {
		mockCastBallot.mockResolvedValue({ ok: false, status: 500, message: 'boom' });
		const { result } = setup();
		let outcome: string | undefined;
		await act(async () => {
			outcome = await result.current.cast('opt-a');
		});
		expect(outcome).toBe('failed');
		await waitFor(() => expect(result.current.myOptionId).toBeNull());
	});

	it('resolves ended when the poll closed meanwhile', async () => {
		mockCastBallot.mockResolvedValue({ ok: false, errorCode: 'vote.ended', message: 'ended' });
		const { result } = setup();
		let outcome: string | undefined;
		await act(async () => {
			outcome = await result.current.cast('opt-a');
		});
		expect(outcome).toBe('ended');
	});
});
