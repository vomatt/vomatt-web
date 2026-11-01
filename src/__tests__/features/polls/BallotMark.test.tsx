import { render } from '@testing-library/react';

import { BallotMark } from '@/features/polls/components/BallotMotion';

describe('BallotMark', () => {
	it('draws an empty ring at rest', () => {
		const { container } = render(<BallotMark state="rest" />);
		expect(container.firstChild).toHaveClass('border-2', 'border-input');
		expect(container.querySelector('.bg-highlight')).toBeNull();
	});

	it.each(['selected', 'voted'] as const)(
		'fills with ink around a Volt check when %s',
		(state) => {
			const { container } = render(<BallotMark state={state} />);
			expect(container.firstChild).toHaveClass('bg-highlight-foreground');
			expect(container.firstChild).toHaveAttribute('data-state', state);
			expect(container.querySelector('svg')).toHaveClass('text-highlight');
			expect(container.querySelector('.bg-highlight')).toBeNull();
		}
	);
});
