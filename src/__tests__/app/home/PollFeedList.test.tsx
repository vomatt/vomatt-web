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
jest.mock('@/features/polls/service', () => ({ getFeed: jest.fn(), getFollowingFeed: jest.fn() }));
jest.mock('@/features/polls/components/PollCard', () => ({ PollCard: () => null }));
jest.mock('react-intersection-observer', () => ({ useInView: () => ({ ref: () => {} }) }));

describe('PollFeedList', () => {
	it('points an empty Following feed to Explore', () => {
		render(<PollFeedList initialPage={{ items: [], nextCursor: null }} following header={null} />);
		expect(screen.getByRole('heading', { name: 'Nothing from people you follow yet.' })).toBeInTheDocument();
		expect(
			screen.getByText('Open polls by people you follow show up here. Follow someone from their profile.')
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Explore polls' })).toHaveAttribute('href', '/explore');
	});
});
