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
	getMyBallot: (...args: unknown[]) => mockGetMyBallot(...args),
}));
const mockGetMyBallot = jest.fn().mockResolvedValue(null);

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

	it('tells the voter to slow down when Ballot writes are rate limited', async () => {
		const { toast } = jest.requireMock('sonner');
		mockCastBallot.mockResolvedValue({ ok: false, status: 429, errorCode: 'common.rate_limited', message: 'slow' });
		const { result } = setup();
		let outcome: string | undefined;
		await act(async () => {
			outcome = await result.current.cast('opt-a');
		});
		expect(outcome).toBe('failed');
		expect(toast.error).toHaveBeenCalledWith("You're voting too fast. Wait a minute and try again.");
	});

	it('tells the voter to slow down when a withdrawal is rate limited', async () => {
		const { toast } = jest.requireMock('sonner');
		mockCastBallot.mockResolvedValue({ ok: true });
		mockRetractBallot.mockResolvedValue({ ok: false, status: 429, errorCode: 'common.rate_limited', message: 'slow' });
		const { result } = setup();
		let outcome: string | undefined;
		await act(async () => {
			await result.current.cast('opt-a');
		});
		await act(async () => {
			outcome = await result.current.retract();
		});
		expect(outcome).toBe('failed');
		expect(toast.error).toHaveBeenCalledWith("You're voting too fast. Wait a minute and try again.");
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

	it('reports an ended poll when the Ballot was the last one it waited for', async () => {
		mockCastBallot.mockResolvedValue({
			ok: true,
			data: { ...poll, active: true, votingActive: false, startTime: '2026-10-01T00:00:00Z', endTime: '2026-10-02T00:00:00Z' },
		});
		const onPollEnded = jest.fn();
		const { result } = renderHook(() => useBallot(poll, { isAuthed: true, onPollEnded }));
		let outcome: string | undefined;
		await act(async () => {
			outcome = await result.current.cast('opt-a');
		});
		expect(outcome).toBe('saved');
		expect(onPollEnded).toHaveBeenCalledWith(expect.objectContaining({ votingActive: false }));
	});

	it('looks up the Ballot when a guest signs in on the card', async () => {
		mockGetMyBallot.mockResolvedValue('opt-a');
		const { result, rerender } = renderHook(
			({ isAuthed }) => useBallot(poll, { isAuthed, onPollEnded: jest.fn() }),
			{ initialProps: { isAuthed: false } }
		);
		expect(mockGetMyBallot).not.toHaveBeenCalled();
		rerender({ isAuthed: true });
		await waitFor(() => expect(result.current.myOptionId).toBe('opt-a'));
	});

	it('trusts the Ballot on a Poll loaded signed in', () => {
		setup();
		expect(mockGetMyBallot).not.toHaveBeenCalled();
	});
});

describe('useBallot anonymity', () => {
	beforeEach(() => jest.clearAllMocks());

	const voted = { ...poll, myOptionId: 'opt-a', myBallotAnonymous: false, participantCount: 1 } as Poll;

	it('takes whether the Ballot is Anonymous from the cast response', async () => {
		mockCastBallot.mockResolvedValue({ ok: true, data: { ...voted, myBallotAnonymous: true } });
		const { result } = setup();
		expect(result.current.anonymous).toBeNull();
		await act(async () => {
			await result.current.cast('opt-a');
		});
		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-a');
		expect(result.current.anonymous).toBe(true);
	});

	it('recasts the same option to make the Ballot Anonymous', async () => {
		mockCastBallot.mockResolvedValue({ ok: true, data: { ...voted, myBallotAnonymous: true } });
		const { result } = renderHook(() => useBallot(voted, { isAuthed: true, onPollEnded: jest.fn() }));
		let outcome: string | undefined;
		await act(async () => {
			outcome = await result.current.setAnonymous(true);
		});
		expect(outcome).toBe('saved');
		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-a', true);
		expect(result.current.anonymous).toBe(true);
		expect(result.current.turnout).toBe(1);
	});

	it('rolls the flag back when the change fails', async () => {
		mockCastBallot.mockResolvedValue({ ok: false, status: 500, message: 'boom' });
		const { result } = renderHook(() => useBallot(voted, { isAuthed: true, onPollEnded: jest.fn() }));
		await act(async () => {
			await result.current.setAnonymous(true);
		});
		expect(result.current.anonymous).toBe(false);
		expect(result.current.myOptionId).toBe('opt-a');
	});

	it('forgets the flag once the Ballot is withdrawn', async () => {
		mockRetractBallot.mockResolvedValue({ ok: true });
		const { result } = renderHook(() => useBallot(voted, { isAuthed: true, onPollEnded: jest.fn() }));
		await act(async () => {
			await result.current.retract();
		});
		expect(result.current.anonymous).toBeNull();
	});

	it('retries once when the Poll is busy', async () => {
		mockCastBallot
			.mockResolvedValueOnce({ ok: false, status: 409, errorCode: 'common.conflict', message: 'busy' })
			.mockResolvedValueOnce({ ok: true, data: { ...voted, myBallotAnonymous: false } });
		const { result } = setup();
		let outcome: string | undefined;
		await act(async () => {
			outcome = await result.current.cast('opt-a');
		});
		expect(outcome).toBe('saved');
		expect(mockCastBallot).toHaveBeenCalledTimes(2);
	});

	it('asks the voter to retry when the Poll is busy', async () => {
		const { toast } = jest.requireMock('sonner');
		mockCastBallot.mockResolvedValue({ ok: false, status: 409, errorCode: 'common.conflict', message: 'Poll is busy, retry' });
		const { result } = setup();
		await act(async () => {
			await result.current.cast('opt-a');
		});
		expect(toast.error).toHaveBeenCalledWith('Poll is busy, retry');
	});
});
