import { render } from '@testing-library/react';

import { LikeHeart } from '@/features/polls/components/LikeHeart';

describe('LikeHeart', () => {
	it('draws the same 2px stroke as the other icons by default', () => {
		const { container } = render(<LikeHeart liked={false} />);
		expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '2');
	});

	it('takes a custom stroke width', () => {
		const { container } = render(<LikeHeart liked={false} strokeWidth={1.8} />);
		expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '1.8');
	});
});
