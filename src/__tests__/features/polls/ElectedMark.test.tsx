import { render, screen } from '@testing-library/react';

import { ElectedMark, WinnerName } from '@/features/polls/components/ElectedMark';

describe('ElectedMark', () => {
	it('is a named image when labelled', () => {
		render(<ElectedMark label="Elected" />);
		expect(screen.getByRole('img', { name: 'Elected' })).toBeInTheDocument();
	});

	it('is hidden from screen readers without a label', () => {
		const { container } = render(<ElectedMark />);
		expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	});
});

describe('WinnerName', () => {
	it('reads as the plain name', () => {
		const { container } = render(<WinnerName name="Market night" />);
		expect(container).toHaveTextContent('Market night');
	});

	it('keeps the stamp on one line with the first character, so a wrap never strands it', () => {
		const { container } = render(<WinnerName name="通勤時" />);
		const nowrap = container.querySelector('.whitespace-nowrap')!;
		expect(nowrap.querySelector('svg')).toBeInTheDocument();
		expect(nowrap).toHaveTextContent(/^通$/);
	});

	it('keeps an emoji whole beside the stamp', () => {
		const { container } = render(<WinnerName name="🍁 Maple" />);
		expect(container.querySelector('.whitespace-nowrap')).toHaveTextContent(/^🍁$/);
	});
});

describe('WinnerName edge cases', () => {
	it('gives screen readers the whole name once, not split at the stamp', () => {
		render(<WinnerName name="Yes" />);
		expect(screen.getByText('Yes')).toHaveClass('sr-only');
		expect(screen.getByText('Yes').nextElementSibling).toHaveAttribute('aria-hidden', 'true');
	});

	it('holds the stamp to the first visible character after leading space or zero-width characters', () => {
		const { container } = render(<WinnerName name={' ​Yes'} />);
		expect(container.querySelector('.whitespace-nowrap')).toHaveTextContent(/^Y$/);
	});

	it('works without Intl.Segmenter (Firefox before 125)', () => {
		const intl = Intl as { Segmenter?: typeof Intl.Segmenter };
		const original = intl.Segmenter;
		delete intl.Segmenter;
		try {
			jest.isolateModules(() => {
				const { WinnerName: Fallback } = require('@/features/polls/components/ElectedMark');
				const { container } = render(<Fallback name="🍁 Maple" />);
				expect(container.querySelector('.whitespace-nowrap')).toHaveTextContent(/^🍁$/);
			});
		} finally {
			intl.Segmenter = original;
		}
	});
});
