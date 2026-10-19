import { render, screen } from '@testing-library/react';

import { FieldMessage } from '@/components/ui/Field';

describe('FieldMessage', () => {
	it('shows the hint while there is no error', () => {
		render(<FieldMessage hint="Keep it short." hintId="hint" />);
		expect(screen.getByText('Keep it short.')).not.toHaveAttribute('aria-hidden');
	});

	it('hides the hint from screen readers once an error takes its place', () => {
		render(
			<FieldMessage hint="Keep it short." hintId="hint" errors={[{ id: 'err', text: 'Too long.' }]} />
		);
		expect(screen.getByText('Keep it short.')).toHaveAttribute('aria-hidden', 'true');
		expect(screen.getByText('Too long.')).toHaveAttribute('id', 'err');
	});

	it('keeps an empty polite live region, so errors are announced as they appear', () => {
		const { container, rerender } = render(<FieldMessage hint="Keep it short." />);
		const region = container.querySelector('[aria-live="polite"]');
		expect(region).toBeEmptyDOMElement();
		rerender(<FieldMessage hint="Keep it short." errors={[{ id: 'err', text: 'Too long.' }]} />);
		expect(region).toHaveTextContent('Too long.');
	});
});
