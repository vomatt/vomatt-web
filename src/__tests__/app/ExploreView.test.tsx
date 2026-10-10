import { act, fireEvent, render, screen } from '@testing-library/react';

import { ExploreView } from '@/app/(frontend)/explore/_components/ExploreView';
import type { Poll } from '@/features/polls/schema';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));
jest.mock('next/link', () => {
	const Link = ({ children, href }: any) => <a href={href}>{children}</a>;
	return Link;
});

const mockGetPolls = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getPolls: (...args: unknown[]) => mockGetPolls(...args),
}));

const poll = (id: string, title: string) =>
	({
		id,
		title,
		active: true,
		votingActive: true,
		creatorId: 'u',
		creatorUsername: 'mei',
		createdAt: '2026-10-01T00:00:00Z',
		startTime: '2026-10-01T00:00:00Z',
		endTime: '2099-10-10T00:00:00Z',
		options: [],
	}) as Poll;

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

describe('ExploreView', () => {
	it('shows the server page without refetching it', async () => {
		render(<ExploreView initialPage={{ items: [poll('p1', 'Lunch?')], nextCursor: null }} tags={[]} />);
		await act(async () => jest.advanceTimersByTime(1000));
		expect(screen.getByText('Lunch?')).toBeInTheDocument();
		expect(mockGetPolls).not.toHaveBeenCalled();
	});

	it('refetches from the first page when the filter changes', async () => {
		mockGetPolls.mockResolvedValue({ items: [poll('p2', 'Dinner?')], nextCursor: null });
		render(<ExploreView initialPage={{ items: [poll('p1', 'Lunch?')], nextCursor: null }} tags={[]} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));

		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'ended', sort: undefined, q: undefined }, null, 20);
		expect(await screen.findByText('Dinner?')).toBeInTheDocument();
	});

	it('waits for a pause in typing and skips one-character searches', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		render(<ExploreView initialPage={{ items: [], nextCursor: null }} tags={[]} />);
		const box = screen.getByRole('searchbox');

		fireEvent.change(box, { target: { value: 'l' } });
		await act(async () => jest.advanceTimersByTime(300));
		expect(mockGetPolls).not.toHaveBeenCalled();

		fireEvent.change(box, { target: { value: 'lu' } });
		fireEvent.change(box, { target: { value: 'lun' } });
		await act(async () => jest.advanceTimersByTime(300));
		expect(mockGetPolls).toHaveBeenCalledTimes(1);
		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'open', sort: 'newest', q: 'lun' }, null, 20);
	});
});
