import { fireEvent, render, screen, within } from '@testing-library/react';

import { HomepageHeader } from '@/app/(frontend)/_components/HomepageHeader';
import { topicHref } from '@/lib/routes';

import { sidePoll } from '../../helpers/sidePoll';

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
const mockFollowTag = jest.fn();
jest.mock('@/features/polls/service', () => ({ followTag: (...args: any[]) => mockFollowTag(...args), unfollowTag: jest.fn() }));

const tags = [{ id: 't1', name: 'Housing', slug: 'housing' }];

describe('HomepageHeader', () => {
	it('shows each topic as a pill link without a "#", the current one marked', () => {
		render(<HomepageHeader tags={tags} activeTag="housing" signedIn />);
		const topics = within(screen.getByRole('navigation', { name: 'Topics' }));
		const housing = topics.getByRole('link', { name: 'Housing' });
		expect(housing).toHaveAttribute('href', topicHref('housing'));
		expect(housing).toHaveAttribute('aria-current', 'page');
		expect(housing).toHaveClass('rounded-full');
		expect(topics.getByRole('link', { name: 'For you' })).not.toHaveAttribute('aria-current');
		expect(screen.queryByText(/#/)).not.toBeInTheDocument();
	});

	it('keeps the Following topic for signed-in viewers only', () => {
		const { unmount } = render(<HomepageHeader tags={tags} signedIn following />);
		expect(screen.getByRole('link', { name: 'Following' })).toHaveAttribute('aria-current', 'page');
		unmount();

		render(<HomepageHeader tags={tags} />);
		expect(screen.queryByRole('link', { name: 'Following' })).not.toBeInTheDocument();
	});

	it('links guests to the legal pages under the login prompt, and not signed-in viewers', () => {
		const { unmount } = render(<HomepageHeader tags={tags} />);
		const legal = within(screen.getByRole('navigation', { name: 'Legal' }));
		expect(legal.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', 'https://about.vomatt.com/terms-of-service');
		expect(legal.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'https://about.vomatt.com/privacy-policy');
		expect(legal.queryByRole('link', { name: 'Cookies' })).not.toBeInTheDocument();
		unmount();

		render(<HomepageHeader tags={tags} signedIn />);
		expect(screen.queryByRole('navigation', { name: 'Legal' })).not.toBeInTheDocument();
	});

	it('keeps Saved off the feed: it lives on the profile', () => {
		render(<HomepageHeader tags={tags} signedIn />);
		expect(screen.getByRole('link', { name: 'Following' })).toHaveAttribute('href', '/following');
		expect(screen.queryByRole('link', { name: 'Saved' })).not.toBeInTheDocument();
	});

	it('offers Follow on a topic page and follows it at once', async () => {
		mockFollowTag.mockResolvedValue({ ok: true });
		render(<HomepageHeader tags={tags} activeTag="housing" signedIn followedTagIds={[]} />);
		fireEvent.click(screen.getByRole('button', { name: 'Follow topic' }));
		expect(await screen.findByRole('button', { name: 'Following topic' })).toHaveAttribute('aria-pressed', 'true');
		expect(mockFollowTag).toHaveBeenCalledWith('t1');
	});

	it('shows a followed topic as followed, and offers no Follow to guests', () => {
		const { unmount } = render(<HomepageHeader tags={tags} activeTag="housing" signedIn followedTagIds={['t1']} />);
		expect(screen.getByRole('button', { name: 'Following topic' })).toBeInTheDocument();
		unmount();
		render(<HomepageHeader tags={tags} activeTag="housing" />);
		expect(screen.queryByRole('button', { name: /topic/ })).not.toBeInTheDocument();
	});

	it('invites guests to log in above the topics, and no one else', () => {
		const { unmount } = render(<HomepageHeader tags={tags} />);
		const prompt = screen.getByRole('heading', { name: 'Log in or sign up for Vomatt' });
		const topics = screen.getByRole('navigation', { name: 'Topics' });
		expect(prompt.compareDocumentPosition(topics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
		unmount();

		render(<HomepageHeader tags={tags} signedIn />);
		expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
	});

	it('offers a non-empty side card as a pill below xl that opens its polls under the topics', () => {
		render(<HomepageHeader tags={tags} signedIn sidePolls={{ resultsIn: [], closingSoon: [sidePoll] }} />);
		const topics = within(screen.getByRole('navigation', { name: 'Topics' }));
		const pill = topics.getByRole('button', { name: 'Closing soon' });
		expect(pill.closest('li')).toHaveClass('xl:hidden');
		expect(pill).toHaveAttribute('aria-expanded', 'false');
		expect(screen.queryByRole('region', { name: 'Closing soon' })).not.toBeInTheDocument();

		fireEvent.click(pill);
		expect(pill).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByRole('region', { name: 'Closing soon' })).toHaveTextContent('Bike lane on Mill Road?');

		fireEvent.click(pill);
		expect(screen.queryByRole('region', { name: 'Closing soon' })).not.toBeInTheDocument();
		// An empty list gets no pill
		expect(topics.queryByRole('button', { name: 'Results are in' })).not.toBeInTheDocument();
	});

	it('opens the card in the sticky bar, outside the Topics navigation', () => {
		render(<HomepageHeader tags={tags} signedIn sidePolls={{ resultsIn: [], closingSoon: [sidePoll] }} />);
		fireEvent.click(screen.getByRole('button', { name: 'Closing soon' }));
		const card = screen.getByRole('region', { name: 'Closing soon' });
		const nav = screen.getByRole('navigation', { name: 'Topics' });
		expect(nav).not.toContainElement(card);
		expect(nav.parentElement).toContainElement(card);
		expect(nav.parentElement).toHaveClass('sticky');
	});

	it('marks the Results are in pill when a result is unread', () => {
		const { unmount } = render(
			<HomepageHeader tags={tags} signedIn sidePolls={{ resultsIn: [{ ...sidePoll, unread: true }], closingSoon: [] }} />
		);
		expect(screen.getByRole('button', { name: /Results are in/ })).toHaveTextContent('Unread');
		unmount();
		render(<HomepageHeader tags={tags} signedIn sidePolls={{ resultsIn: [sidePoll], closingSoon: [] }} />);
		expect(screen.getByRole('button', { name: 'Results are in' })).not.toHaveTextContent('Unread');
	});

	it('closes an open card whose list empties on refresh', () => {
		const { rerender } = render(
			<HomepageHeader tags={tags} signedIn sidePolls={{ resultsIn: [sidePoll], closingSoon: [sidePoll] }} />
		);
		fireEvent.click(screen.getByRole('button', { name: 'Closing soon' }));
		rerender(<HomepageHeader tags={tags} signedIn sidePolls={{ resultsIn: [sidePoll], closingSoon: [] }} />);
		expect(screen.queryByRole('region', { name: 'Closing soon' })).not.toBeInTheDocument();
	});
});
