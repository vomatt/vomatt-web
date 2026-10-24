import { render, screen } from '@testing-library/react';

import { UnreadDot } from '@/features/notifications/UnreadDot';

describe('UnreadDot', () => {
	it('names what is unread for screen readers', () => {
		render(<UnreadDot label="Unread" className="absolute" />);
		expect(screen.getByText('Unread').parentElement).toHaveClass('bg-alert', 'absolute');
	});

	it('is part of the accessible name of the link it sits in', () => {
		render(
			<a href="#ended">
				Ended <UnreadDot label="Unread" />
			</a>
		);
		expect(screen.getByRole('link', { name: 'Ended Unread' })).toBeInTheDocument();
	});
});
