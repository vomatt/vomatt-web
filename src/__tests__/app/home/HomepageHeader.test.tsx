import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { HomepageHeader } from '@/app/(frontend)/_components/HomepageHeader';
import { topicHref } from '@/lib/routes';

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
		const { unmount } = render(<HomepageHeader tags={tags} signedIn feed="following" />);
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

	it('links Results are in and Closing soon as feeds for signed-in viewers, kept to phones and tablets', () => {
		const { unmount } = render(<HomepageHeader tags={tags} signedIn />);
		const topics = within(screen.getByRole('navigation', { name: 'Topics' }));
		const results = topics.getByRole('link', { name: 'Results are in' });
		const closing = topics.getByRole('link', { name: 'Closing soon' });
		expect(results).toHaveAttribute('href', '/results-in');
		expect(closing).toHaveAttribute('href', '/closing-soon');
		// From xl the rail's card titles link there instead
		expect(results.closest('li')).toHaveClass('xl:hidden');
		expect(closing.closest('li')).toHaveClass('xl:hidden');
		expect(topics.queryByRole('button')).not.toBeInTheDocument();
		unmount();

		render(<HomepageHeader tags={tags} />);
		expect(screen.queryByRole('link', { name: 'Results are in' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Closing soon' })).not.toBeInTheDocument();
	});

	it('marks the current feed at every width, and names the page after it', () => {
		render(<HomepageHeader tags={tags} signedIn feed="closingSoon" />);
		const closing = screen.getByRole('link', { name: 'Closing soon' });
		expect(closing).toHaveAttribute('aria-current', 'page');
		expect(closing.closest('li')).not.toHaveClass('xl:hidden');
		expect(screen.getByRole('link', { name: 'For you' })).not.toHaveAttribute('aria-current');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Closing soon');
	});

	it('marks the Results are in pill once the unread check streams in', async () => {
		const { unmount } = await act(async () => render(<HomepageHeader tags={tags} signedIn resultsUnread={Promise.resolve(true)} />));
		expect(screen.getByRole('link', { name: /Results are in/ })).toHaveTextContent('Unread');
		unmount();
		await act(async () => render(<HomepageHeader tags={tags} signedIn resultsUnread={Promise.resolve(false)} />));
		expect(screen.getByRole('link', { name: 'Results are in' })).not.toHaveTextContent('Unread');
	});
});
