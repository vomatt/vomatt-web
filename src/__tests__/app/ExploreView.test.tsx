import { act, fireEvent, render, screen } from '@testing-library/react';

import { ExploreView } from '@/app/(frontend)/explore/_components/ExploreView';
import { EXPLORE_PAGE_SIZE } from '@/features/polls/constants';
import type { Poll, TagDto } from '@/features/polls/schema';

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

const noTopics: TagDto[] = [];
const topic = (slug: string, name: string, usageCount: number): TagDto => ({ id: slug, slug, name, usageCount });

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	window.history.replaceState(null, '', '/explore');
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
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);
		await act(async () => jest.advanceTimersByTime(1000));
		expect(screen.getByText('Lunch?')).toBeInTheDocument();
		expect(mockGetPolls).not.toHaveBeenCalled();
	});

	it('refetches from the first page when the filter changes', async () => {
		mockGetPolls.mockResolvedValue({ items: [poll('p2', 'Dinner?')], nextCursor: null });
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));

		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'ended', sort: undefined, q: undefined, tag: undefined }, null, EXPLORE_PAGE_SIZE, { asViewer: true });
		expect(await screen.findByText('Dinner?')).toBeInTheDocument();
	});

	it('waits for a pause in typing and skips one-character searches', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
		const box = screen.getByRole('searchbox');

		fireEvent.change(box, { target: { value: 'l' } });
		await act(async () => jest.advanceTimersByTime(300));
		expect(mockGetPolls).not.toHaveBeenCalled();

		fireEvent.change(box, { target: { value: 'lu' } });
		fireEvent.change(box, { target: { value: 'lun' } });
		await act(async () => jest.advanceTimersByTime(300));
		expect(mockGetPolls).toHaveBeenCalledTimes(1);
		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'open', sort: 'newest', q: 'lun', tag: undefined }, null, EXPLORE_PAGE_SIZE, { asViewer: true });
	});

	it('sorts open polls by most voted', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
		fireEvent.click(screen.getByRole('button', { name: 'Most voted' }));
		await act(async () => jest.advanceTimersByTime(300));
		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'open', sort: 'top', q: undefined, tag: undefined }, null, EXPLORE_PAGE_SIZE, { asViewer: true });
	});

	it('loads more of the listed polls until the new sort\'s first page arrives', async () => {
		mockGetPolls.mockResolvedValue({ items: [poll('p2', 'Dinner?')], nextCursor: null });
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: 'c1' })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Most voted' }));
		fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
		// The cursor belongs to the newest ordering, so it goes back with that query
		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'open', sort: 'newest', q: undefined, tag: undefined }, 'c1', EXPLORE_PAGE_SIZE, { asViewer: true });
		await act(async () => jest.advanceTimersByTime(300));
	});

	it('keeps the previous results, inert, while a new query loads', async () => {
		mockGetPolls.mockReturnValue(new Promise(() => {}));
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));

		const results = screen.getByText('Lunch?').closest('[aria-busy]');
		expect(results).toHaveAttribute('aria-busy', 'true');
		expect(results).toHaveAttribute('inert');
	});

	it('names the search box and each filter group', async () => {
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
		expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
		expect(screen.getByRole('group', { name: 'Status' })).toBeInTheDocument();
		expect(screen.getByRole('group', { name: 'Sort' })).toBeInTheDocument();
	});

	it('lists each Poll as a tile linking to its page, with no ballot', async () => {
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);
		expect(screen.getByRole('link', { name: 'Lunch?' })).toHaveAttribute('href', '/poll/p1');
		expect(screen.queryByRole('radio')).not.toBeInTheDocument();
	});

	it('offers the topics and filters by the one picked', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		const topics = [topic('transport', 'Transport', 9), topic('food', 'Food', 3)];
		await renderView(<ExploreView topics={topics} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
		const pills = screen.getByRole('list', { name: 'Topics' });
		expect(pills).toHaveTextContent('TransportFood');

		fireEvent.click(screen.getByRole('button', { name: 'Food' }));
		await act(async () => jest.advanceTimersByTime(300));
		expect(mockGetPolls).toHaveBeenCalledWith(
			{ status: 'open', sort: 'newest', q: undefined, tag: 'food' }, null, EXPLORE_PAGE_SIZE, { asViewer: true }
		);
		expect(screen.getByRole('button', { name: 'Food' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('shows the topics a search matches, and picking one replaces the search', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		const topics = [topic('food', 'Food', 3), topic('transport', 'Transport', 9)];
		await renderView(<ExploreView topics={topics} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
		const box = screen.getByRole('searchbox');

		fireEvent.change(box, { target: { value: 'tran' } });
		expect(screen.queryByRole('button', { name: 'Food' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Transport' }));
		await act(async () => jest.advanceTimersByTime(300));

		expect(box).toHaveValue('');
		expect(mockGetPolls).toHaveBeenLastCalledWith(
			{ status: 'open', sort: 'newest', q: undefined, tag: 'transport' }, null, EXPLORE_PAGE_SIZE, { asViewer: true }
		);
	});

	it('suggests the other status when nothing is found', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);
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
		await renderView(<ExploreView topics={noTopics} initialPage={firstPage} />);

		// The filters render before the list streams in
		await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Ended' })));
		await act(async () => resolveFirst({ items: [poll('p1', 'Lunch?')], nextCursor: null }));
		// Once to reveal the streamed list, once for the search debounce it then starts
		await act(async () => jest.advanceTimersByTime(300));
		await act(async () => jest.advanceTimersByTime(300));

		expect(mockGetPolls).toHaveBeenCalledWith({ status: 'ended', sort: undefined, q: undefined, tag: undefined }, null, EXPLORE_PAGE_SIZE, { asViewer: true });
		expect(await screen.findByText('Dinner?')).toBeInTheDocument();
	});

	it('clears the topic when its pill is tapped again', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView topics={[topic('food', 'Food', 3)]} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Food' }));
		await act(async () => jest.advanceTimersByTime(300));
		fireEvent.click(screen.getByRole('button', { name: 'Food' }));
		await act(async () => jest.advanceTimersByTime(300));

		expect(screen.getByRole('button', { name: 'Food' })).toHaveAttribute('aria-pressed', 'false');
		expect(mockGetPolls).toHaveBeenLastCalledWith(
			{ status: 'open', sort: 'newest', q: undefined, tag: undefined }, null, EXPLORE_PAGE_SIZE, { asViewer: true }
		);
	});

	it('keeps the picked topic first while a search matches other topics', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		const topics = [topic('transport', 'Transport', 9), topic('food', 'Food', 3)];
		await renderView(<ExploreView topics={topics} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Food' }));
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tran' } });

		expect(screen.getByRole('list', { name: 'Topics' })).toHaveTextContent('FoodTransport');
	});

	it('points at the topic when it is what emptied the grid', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView topics={[topic('food', 'Food', 3)]} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Food' }));
		await act(async () => jest.advanceTimersByTime(300));

		expect(screen.getByText('Try another topic, or tap it again to see every poll.')).toBeInTheDocument();
	});

	it('says a one-character search is too short in the search box, however long the list', async () => {
		const page = Array.from({ length: EXPLORE_PAGE_SIZE }, (_, i) => poll(`p${i}`, `Poll ${i}`));
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: page, nextCursor: 'c1' })} />);
		const box = screen.getByRole('searchbox');

		fireEvent.change(box, { target: { value: 'l' } });
		await act(async () => jest.advanceTimersByTime(300));

		expect(box).toHaveAccessibleDescription('Type at least 2 characters to search.');
		expect(screen.getByText('Poll 0')).toBeInTheDocument();
		expect(mockGetPolls).not.toHaveBeenCalled();
	});

	it('treats a single emoji as too short instead of sending it', async () => {
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);
		const box = screen.getByRole('searchbox');

		fireEvent.change(box, { target: { value: '😀' } });
		await act(async () => jest.advanceTimersByTime(300));

		expect(mockGetPolls).not.toHaveBeenCalled();
		expect(box).toHaveAccessibleDescription('Type at least 2 characters to search.');
		expect(screen.queryByText('Couldn’t load polls.')).not.toBeInTheDocument();
	});

	it('shows a loading status from the moment a filter changes until its results land', async () => {
		let resolve!: (page: { items: Poll[]; nextCursor: null }) => void;
		mockGetPolls.mockReturnValue(new Promise((r) => (resolve = r)));
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);
		expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();

		await act(async () => jest.advanceTimersByTime(300));
		await act(async () => resolve({ items: [poll('p2', 'Dinner?')], nextCursor: null }));
		expect(screen.getByText('Dinner?')).toBeInTheDocument();
		expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
	});

	it('opens with the search and filters from the address, without refetching', async () => {
		await renderView(
			<ExploreView
				topics={[topic('food', 'Food', 3)]}
				initial={{ query: 'lunch', status: 'ended', sort: 'newest', tag: 'food' }}
				initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })}
			/>
		);
		await act(async () => jest.advanceTimersByTime(1000));

		expect(screen.getByRole('searchbox')).toHaveValue('lunch');
		expect(screen.getByRole('button', { name: 'Ended' })).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', { name: 'Food' })).toHaveAttribute('aria-pressed', 'true');
		expect(mockGetPolls).not.toHaveBeenCalled();
	});

	it('keeps the search and filters in the address', async () => {
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'lun' } });
		await act(async () => jest.advanceTimersByTime(300));
		expect(window.location.pathname).toBe('/explore');
		expect(window.location.search).toBe('?status=ended&q=lun');

		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
		await act(async () => jest.advanceTimersByTime(300));
		expect(window.location.search).toBe('');
	});

	it('retries a search that failed', async () => {
		mockGetPolls.mockRejectedValueOnce(new Error('down')).mockResolvedValue({ items: [poll('p2', 'Dinner?')], nextCursor: null });
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));
		expect(screen.getByText(/Couldn’t load polls/)).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		await act(async () => jest.advanceTimersByTime(300));
		expect(await screen.findByText('Dinner?')).toBeInTheDocument();
		expect(mockGetPolls).toHaveBeenCalledTimes(2);
	});

	it('does not dim the list before a new query is sent, after one was dropped mid-load', async () => {
		mockGetPolls.mockReturnValue(new Promise(() => {}));
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));
		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		fireEvent.click(screen.getByRole('button', { name: 'Most voted' }));

		expect(screen.getByText('Lunch?').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'false');
	});

	it('keeps address parameters that are not filters', async () => {
		window.history.replaceState(null, '', '/explore?utm_source=mail#top');
		mockGetPolls.mockResolvedValue({ items: [], nextCursor: null });
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));
		expect(window.location.search).toBe('?utm_source=mail&status=ended');
		expect(window.location.hash).toBe('#top');
	});

	it('leaves the list usable when the filters go back to the listed ones mid-load', async () => {
		mockGetPolls.mockReturnValue(new Promise(() => {}));
		await renderView(<ExploreView topics={noTopics} initialPage={Promise.resolve({ items: [poll('p1', 'Lunch?')], nextCursor: null })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ended' }));
		await act(async () => jest.advanceTimersByTime(300));
		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		await act(async () => jest.advanceTimersByTime(300));

		expect(screen.getByText('Lunch?').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'false');
		expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
		expect(mockGetPolls).toHaveBeenCalledTimes(1);
	});
});
