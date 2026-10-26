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
// The card itself has its own tests; here it only has to show which Poll it is
jest.mock('@/features/polls/components/PollCard', () => ({
	PollCard: ({ poll }: { poll: Poll }) => <article>{poll.title}</article>,
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

/** Renders the view and waits for the streamed first page to land. */
async function renderView(...args: Parameters<typeof render>) {
	// Rendered inside an awaited act, so the suspended list can resolve
	let view!: ReturnType<typeof render>;
	await act(async () => {
		view = render(...args);
	});
	return view;
}

describe('ExploreView', () => {
	it('shows the server page without refetching it', async () => {
		await renderView(<ExploreView initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);
		await act(async () => jest.advanceTimersByTime(1000));
		expect(screen.getByText('Lunch?')).toBeInTheDocument();
		expect(mockGetPolls).not.toHaveBeenCalled();
	});

	it('refetches from the first page when the filter changes', async () => {
		mockGetPolls.mockResolvedValue({ items: [poll('p2', 'Dinner?')], nextCursor: null });
		await renderView(<ExploreView initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));

		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'ended', sort: undefined, q: undefined }, null, 20, { asViewer: true });
		expect(await screen.findByText('Dinner?')).toBeInTheDocument();
	});

	it('waits for a pause in typing and skips one-character searches', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
		const box = screen.getByRole('searchbox');

		fireEvent.change(box, { target: { value: 'l' } });
		await act(async () => jest.advanceTimersByTime(300));
		expect(mockGetPolls).not.toHaveBeenCalled();

		fireEvent.change(box, { target: { value: 'lu' } });
		fireEvent.change(box, { target: { value: 'lun' } });
		await act(async () => jest.advanceTimersByTime(300));
		expect(mockGetPolls).toHaveBeenCalledTimes(1);
		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'open', sort: 'newest', q: 'lun' }, null, 20, { asViewer: true });
	});

	it('sorts open polls by most voted', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
		fireEvent.click(screen.getByRole('button', { name: 'Most voted' }));
		await act(async () => jest.advanceTimersByTime(300));
		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'open', sort: 'top', q: undefined }, null, 20, { asViewer: true });
	});

	it('loads more of the listed polls until the new sort\'s first page arrives', async () => {
		mockGetPolls.mockResolvedValue({ items: [poll('p2', 'Dinner?')], nextCursor: null });
		await renderView(<ExploreView initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: 'c1' })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Most voted' }));
		fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
		// The cursor belongs to the newest ordering, so it goes back with that query
		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'open', sort: 'newest', q: undefined }, 'c1', 20, { asViewer: true });
		await act(async () => jest.advanceTimersByTime(300));
	});

	it('keeps the previous results, inert, while a new query loads', async () => {
		mockGetPolls.mockReturnValue(new Promise(() => {}));
		await renderView(<ExploreView initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));

		const results = screen.getByText('Lunch?').closest('[aria-busy]');
		expect(results).toHaveAttribute('aria-busy', 'true');
		expect(results).toHaveAttribute('inert');
	});

	it('names the search box and each filter group', async () => {
		await renderView(<ExploreView initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
		expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
		expect(screen.getByRole('group', { name: 'Status' })).toBeInTheDocument();
		expect(screen.getByRole('group', { name: 'Sort' })).toBeInTheDocument();
	});

	it('shows each Poll as a full card', async () => {
		await renderView(<ExploreView initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);
		expect(screen.getByRole('article')).toHaveTextContent('Lunch?');
	});

	it('suggests the other status when nothing is found', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
		expect(screen.getByRole('heading', { name: 'No polls found.' })).toBeInTheDocument();
		expect(screen.getByText('Try other words, or switch to Ended polls.')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));
		expect(screen.getByText('Try other words, or switch to Open polls.')).toBeInTheDocument();
	});

	it('fetches a filter picked before the first page arrived', async () => {
		mockGetPolls.mockResolvedValue({ items: [poll('p2', 'Dinner?')], nextCursor: null });
		let resolveFirst!: (page: { items: Poll[]; nextCursor: null }) => void;
		const firstPage = new Promise<{ items: Poll[]; nextCursor: null }>((resolve) => (resolveFirst = resolve));
		await renderView(<ExploreView initialPage={firstPage} />);

		// The filters render before the list streams in
		await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Ended' })));
		await act(async () => resolveFirst({ items: [poll('p1', 'Lunch?')], nextCursor: null }));
		// Once to reveal the streamed list, once for the search debounce it then starts
		await act(async () => jest.advanceTimersByTime(300));
		await act(async () => jest.advanceTimersByTime(300));

		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'ended', sort: undefined, q: undefined }, null, 20, { asViewer: true });
		expect(await screen.findByText('Dinner?')).toBeInTheDocument();
	});
});
