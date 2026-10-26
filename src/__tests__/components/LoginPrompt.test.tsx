import { render, screen } from '@testing-library/react';

import { LoginPrompt } from '@/components/LoginPrompt';

jest.mock('next/link', () => {
	return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

describe('LoginPrompt', () => {
	it('invites a guest to log in', () => {
		render(<LoginPrompt />);
		expect(screen.getByRole('heading', { name: 'Log in or sign up for Vomatt' })).toBeInTheDocument();
		expect(screen.getByText('See what people are talking about and join the conversation.')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
	});

	it('on a poll, says logging in opens it and comes back to it', () => {
		render(<LoginPrompt forPoll redirectTo="/poll/p1" sessionExpired />);
		expect(
			screen.getByText('See what people are talking about and join the conversation. Log in to open this poll.')
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
			'href',
			'/login?redirect=%2Fpoll%2Fp1&session_expired=1'
		);
	});
});
