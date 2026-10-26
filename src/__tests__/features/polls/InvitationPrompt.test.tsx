import { act, fireEvent, render, screen } from '@testing-library/react';

import { InvitationPrompt } from '@/features/polls/components/InvitationPrompt';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const creator = { username: 'alice', avatarUrl: 'bot:boba' };

describe('InvitationPrompt', () => {
	it('names who invited a signed-out visitor and offers sign-in back to the Poll', () => {
		render(<InvitationPrompt creator={creator} pollId="poll-1" />);
		expect(screen.getByRole('heading', { level: 1, name: 'alice invited you to a poll' })).toBeInTheDocument();
		expect(screen.getByText('Invite only')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
			'href',
			'/login?redirect=%2Fpoll%2Fpoll-1'
		);
	});

	it('offers a signed-in visitor to switch to the invited account', async () => {
		const switchAccount = jest.fn().mockResolvedValue(undefined);
		render(<InvitationPrompt creator={creator} pollId="poll-1" switchAccount={switchAccount} />);
		expect(screen.getByText(/This account can’t open it/)).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();

		await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Switch account' })));
		expect(switchAccount).toHaveBeenCalled();
	});
});
