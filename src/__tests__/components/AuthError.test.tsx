import { render, screen } from '@testing-library/react';

import { AuthError } from '@/components/auth/AuthError';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

describe('AuthError', () => {
	it('renders nothing without an error', () => {
		render(<AuthError error={null} />);
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('announces the translated error as an alert', () => {
		render(<AuthError error="codeExpired" />);
		expect(screen.getByRole('alert')).toHaveTextContent("This code has expired. Request a new one.");
	});

	it('tells a community account to sign in as a member and switch', () => {
		render(<AuthError error="communitySignIn" />);
		expect(screen.getByRole('alert')).toHaveTextContent(
			'Community accounts can’t sign in. Sign in with your own account, then switch.'
		);
	});
});
