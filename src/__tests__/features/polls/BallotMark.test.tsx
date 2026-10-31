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

	it('swaps the dot for a Volt check once the vote is in', () => {
		const { container } = render(<BallotMark state="voted" />);
		expect(container.firstChild).toHaveClass('bg-highlight-foreground');
		expect(container.firstChild).toHaveAttribute('data-state', 'voted');
		expect(container.querySelector('svg')).toHaveClass('text-highlight');
		expect(container.querySelector('.bg-highlight')).toBeNull();
	});
});
