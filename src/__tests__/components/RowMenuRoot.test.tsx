import { Menu } from '@base-ui/react/menu';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RowMenuRoot } from '@/components/RowMenuRoot';

const renderMenu = () =>
	render(
		<RowMenuRoot modal={false}>
			<Menu.Trigger>More</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner>
					<Menu.Popup>
						<Menu.Item>Report</Menu.Item>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</RowMenuRoot>
	);

describe('RowMenuRoot', () => {
	it('closes once a scroll carries its trigger away, and stays open for other scrolls', async () => {
		renderMenu();
		const trigger = screen.getByRole('button', { name: 'More' });
		fireEvent.click(trigger);
		expect(await screen.findByRole('menuitem', { name: 'Report' })).toBeInTheDocument();

		window.dispatchEvent(new Event('scroll'));
		expect(screen.getByRole('menuitem', { name: 'Report' })).toBeInTheDocument();

		trigger.getBoundingClientRect = () => ({ top: -200, left: 0 }) as DOMRect;
		window.dispatchEvent(new Event('scroll'));
		await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Report' })).not.toBeInTheDocument());
	});
});
