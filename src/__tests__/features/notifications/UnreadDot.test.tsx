import { render, screen } from '@testing-library/react';

import { UnreadDot } from '@/features/notifications/UnreadDot';

describe('UnreadDot', () => {
	it('names what is unread for screen readers', () => {
		render(<UnreadDot label="Unread" className="absolute" />);
		expect(screen.getByLabelText('Unread')).toHaveClass('bg-volt', 'absolute');
	});
});
