import { render, screen } from '@testing-library/react';

import { PageShell } from '@/components/layout/PageShell';

// jsdom has no layout, so the reserved rail column is checked by its width class
function railColumn(main: HTMLElement) {
	return main.nextElementSibling as HTMLElement;
}

describe('PageShell', () => {
	it('renders the page beside its rail', () => {
		render(<PageShell rail={<aside>Rail</aside>}>Main</PageShell>);
		const main = screen.getByText('Main');
		expect(railColumn(main)).toContainElement(screen.getByText('Rail'));
	});

	it('keeps the rail column on a page without a rail, so the main column does not move', () => {
		render(<PageShell>Main</PageShell>);
		const column = railColumn(screen.getByText('Main'));
		expect(column).toBeEmptyDOMElement();
		expect(column).toHaveClass('xl:w-rail', 'xl:shrink-0');
	});
});
