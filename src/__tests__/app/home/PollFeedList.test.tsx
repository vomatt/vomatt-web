import { render, screen } from '@testing-library/react';

import { PollFeedList } from '@/app/(frontend)/_components/PollFeedList';

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
jest.mock('@/features/polls/service', () => ({
	loadFeed: jest.fn(),
}));
jest.mock('@/features/polls/components/PollCard', () => ({ PollCard: () => null }));
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
});
