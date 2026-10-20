import { render, screen } from '@testing-library/react';

import { InvitationPrompt } from '@/features/polls/components/InvitationPrompt';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const creator = { username: 'alice', avatarUrl: 'bot:boba' };

describe('InvitationPrompt', () => {
	it('names who invited a signed-out visitor and offers sign-in back to the Poll', () => {
		render(<InvitationPrompt creator={creator} pollId="poll-1" signedIn={false} />);
		expect(screen.getByRole('heading', { name: 'alice invited you to a poll' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
			'href',
			'/login?redirect=%2Fpoll%2Fpoll-1'
		);
	});

	it('tells a signed-in visitor to use the invited address instead', () => {
		render(<InvitationPrompt creator={creator} pollId="poll-1" signedIn />);
		expect(screen.getByText(/This account can’t open it/)).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
	});
});
