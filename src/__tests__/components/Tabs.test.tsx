import { render, screen } from '@testing-library/react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

function renderTabs(marks: React.ComponentProps<typeof TabsTrigger>['marks']) {
	render(
		<Tabs defaultValue="a">
			<TabsList variant="line">
				<TabsTrigger value="a" marks={marks}>
					Voted
					<span className="sr-only">(Only you)</span>
				</TabsTrigger>
			</TabsList>
		</Tabs>
	);
	return screen.getByRole('tab');
}

describe('TabsTrigger marks', () => {
	it('shows the marks inside the tab without adding them to its name', () => {
		const tab = renderTabs(<span data-testid="lock">lock</span>);
		expect(tab).toContainElement(screen.getByTestId('lock'));
		expect(tab).toHaveAccessibleName('Voted (Only you)');
	});

	it('renders nothing extra when there are no marks', () => {
		const tab = renderTabs(false);
		expect(tab).toHaveTextContent(/^Voted\(Only you\)$/);
		expect(tab.querySelector('[aria-hidden]')).toBeNull();
	});
});
