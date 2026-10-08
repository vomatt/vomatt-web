import { render, screen } from '@testing-library/react';

import { AuthError } from '@/components/auth/AuthError';

describe('AuthError', () => {
	it('renders nothing without a message', () => {
		render(<AuthError message={null} />);
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('announces the message as an alert', () => {
		render(<AuthError message="Code expired" />);
		expect(screen.getByRole('alert')).toHaveTextContent('Code expired');
	});
});
