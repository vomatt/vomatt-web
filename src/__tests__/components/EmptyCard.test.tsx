import { render, screen } from '@testing-library/react';

import { EmptyCard } from '@/components/EmptyCard';

describe('EmptyCard', () => {
	it('titles the state as a section heading by default', () => {
		render(<EmptyCard icon={<svg />} title="No polls found." body="Try other words." />);
		expect(screen.getByRole('heading', { level: 2, name: 'No polls found.' })).toBeInTheDocument();
		expect(screen.getByText('Try other words.')).toBeInTheDocument();
	});

	it('can be the page title where nothing else is', () => {
		render(<EmptyCard icon={<svg />} title="Page not found" headingLevel={1} action={<a href="/">Go home</a>} />);
		expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Go home' })).toBeInTheDocument();
	});
});
