import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { PollFeedList } from '@/app/(frontend)/_components/PollFeedList';
import { Refreshable } from '@/components/Refreshable';
import type { Poll } from '@/features/polls/schema';

import { drag, FAR_ENOUGH } from '../../helpers/pull';

jest.mock('next/link', () => {
	return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockLoadFeed = jest.fn();
jest.mock('@/features/polls/service', () => ({
	loadFeed: (...args: unknown[]) => mockLoadFeed(...args),
}));
jest.mock('@/features/polls/components/PollCard', () => ({ PollCard: ({ poll }: { poll: { id: string } }) => <p>{poll.id}</p> }));
// The router's refresh re-renders the page with a new first page, in the same transition
let mockOnRefresh = () => {};
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: () => mockOnRefresh() }) }));
// jsdom has no IntersectionObserver; here the sentinel never comes into view
global.IntersectionObserver = class {
	observe() {}
	disconnect() {}
} as unknown as typeof IntersectionObserver;

describe('PollFeedList', () => {
	it('points an empty Following feed to Explore', () => {
		render(<PollFeedList initialPage={{ items: [], nextCursor: null }} feed="following" header={null} />);
		expect(screen.getByRole('heading', { name: 'Nothing from people you follow yet.' })).toBeInTheDocument();
		expect(
			screen.getByText('Open polls by people you follow show up here. Follow someone from their profile.')
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Explore polls' })).toHaveAttribute('href', '/explore');
	});

	it.each([
		['resultsIn', 'No results yet.'],
		['closingSoon', 'Nothing closes in the next day.'],
	] as const)('says why an empty %s feed is empty, without offering to create a poll', (feed, title) => {
		render(<PollFeedList initialPage={{ items: [], nextCursor: null }} feed={feed} header={null} />);
		expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Create the first poll' })).not.toBeInTheDocument();
	});

	it('says nothing is there only once no pages remain', () => {
		render(<PollFeedList initialPage={{ items: [], nextCursor: 'more' }} feed="resultsIn" header={null} />);
		expect(screen.queryByRole('heading', { name: 'No results yet.' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
	});

	describe('after more pages loaded', () => {
		const poll = (id: string) => ({ id }) as Poll;
		const first = { items: [poll('a1')], nextCursor: 'c1' };

		function Page() {
			const [page, setPage] = useState(first);
			const [refreshes, setRefreshes] = useState(true);
			mockOnRefresh = refreshes ? () => setPage({ items: [poll('b1')], nextCursor: 'c2' }) : () => {};
			return (
				<Refreshable>
					<PollFeedList initialPage={page} header={null} />
					{/* A re-render with a new first page that isn't a refresh, as a vote's revalidation brings */}
					<button onClick={() => setPage({ items: [poll('v1')], nextCursor: 'c3' })}>Revalidate</button>
					<button onClick={() => setRefreshes(false)}>Fail refreshes</button>
				</Refreshable>
			);
		}

		async function loadSecondPage() {
			mockLoadFeed.mockResolvedValueOnce({ items: [poll('a2')], nextCursor: null });
			render(<Page />);
			await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Load more' })));
			expect(screen.getByText('a2')).toBeInTheDocument();
		}

		it('keeps them through a re-render that is not a refresh, with new polls on top', async () => {
			await loadSecondPage();
			fireEvent.click(screen.getByRole('button', { name: 'Revalidate' }));
			expect(screen.getAllByText(/^[av]\d$/).map((el) => el.textContent)).toEqual(['v1', 'a1', 'a2']);
		});

		it('keeps them when a refresh brings no new page, even after a revalidation', async () => {
			await loadSecondPage();
			fireEvent.click(screen.getByRole('button', { name: 'Revalidate' }));
			fireEvent.click(screen.getByRole('button', { name: 'Fail refreshes' }));
			drag(0, FAR_ENOUGH);
			expect(screen.getByText('a2')).toBeInTheDocument();
		});

		it('starts again from the new first page on refresh', async () => {
			await loadSecondPage();
			drag(0, FAR_ENOUGH);
			expect(await screen.findByText('b1')).toBeInTheDocument();
			expect(screen.queryByText('a1')).not.toBeInTheDocument();
			expect(screen.queryByText('a2')).not.toBeInTheDocument();
		});
	});
});
