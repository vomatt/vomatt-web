import { render } from '@testing-library/react';

import { BallotMark } from '@/features/polls/components/BallotMotion';

describe('BallotMark', () => {
	it('draws an empty ring at rest', () => {
		const { container } = render(<BallotMark state="rest" />);
		expect(container.firstChild).toHaveClass('border-2', 'border-input');
		expect(container.querySelector('.bg-highlight')).toBeNull();
	});

	it('fills with ink around a Volt dot once chosen', () => {
		const { container } = render(<BallotMark state="selected" />);
		expect(container.firstChild).toHaveClass('bg-highlight-foreground');
		expect(container.querySelector('.bg-highlight')).toHaveClass(
			'rounded-full'
		);
		expect(container.querySelector('svg')).toBeNull();
	});
});
