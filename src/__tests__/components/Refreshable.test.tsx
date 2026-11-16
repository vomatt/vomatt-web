import { render, screen } from '@testing-library/react';

import { PULL_THRESHOLD, Refreshable, useRefreshGeneration } from '@/components/Refreshable';

import { drag, FAR_ENOUGH as farEnough, touch } from '../helpers/pull';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
	refresh.mockReset();
	window.scrollY = 0;
});

describe('Refreshable', () => {
	it('counts finished refreshes', () => {
		function Generation() {
			return <p>Generation {useRefreshGeneration()}</p>;
		}
		render(
			<Refreshable>
				<Generation />
			</Refreshable>
		);
		expect(screen.getByText('Generation 0')).toBeInTheDocument();
		drag(0, farEnough);
		expect(screen.getByText('Generation 1')).toBeInTheDocument();
	});

	it('refetches when pulled down far enough from the top', () => {
		render(<Refreshable>page</Refreshable>);
		drag(0, farEnough);
		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it('does not refetch on a short pull, a sideways swipe, an upward scroll or a cancelled touch', () => {
		render(<Refreshable>page</Refreshable>);
		drag(0, PULL_THRESHOLD);
		drag(farEnough * 2, farEnough);
		// Scrolling the page up first, then coming back down past the start
		touch('touchstart', document.body, 0, 0);
		touch('touchmove', document.body, 0, -200);
		touch('touchmove', document.body, 0, farEnough);
		touch('touchend', document.body, 0, farEnough);
		drag(0, farEnough, { end: 'touchcancel' });
		expect(refresh).not.toHaveBeenCalled();
	});

	it('does not refetch when the page is scrolled down or the pull starts in a dialog or menu', () => {
		render(
			<Refreshable>
				<div role="dialog">dialog</div>
				<div role="menu">menu</div>
			</Refreshable>
		);
		drag(0, farEnough, { target: screen.getByRole('dialog') });
		drag(0, farEnough, { target: screen.getByRole('menu') });
		window.scrollY = 200;
		drag(0, farEnough);
		expect(refresh).not.toHaveBeenCalled();
	});

	it("turns off the browser's own pull-to-refresh while mounted", () => {
		const { unmount } = render(<Refreshable>page</Refreshable>);
		expect(document.documentElement.style.overscrollBehaviorY).toBe('contain');
		unmount();
		expect(document.documentElement.style.overscrollBehaviorY).toBe('');
	});
});
