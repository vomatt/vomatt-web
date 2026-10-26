import { render, screen, within } from '@testing-library/react';

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
});
