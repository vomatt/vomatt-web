import { renderHook } from '@testing-library/react';

import { useCloseOnScrollAway } from '@/hooks/useCloseOnScrollAway';

const anchorAt = (top: { value: number }) => {
	const anchor = document.createElement('a');
	anchor.getBoundingClientRect = () => ({ top: top.value, left: 0 }) as DOMRect;
	return anchor;
};

describe('useCloseOnScrollAway', () => {
	it('closes once a scroll carries the anchor away', () => {
		const top = { value: 300 };
		const close = jest.fn();
		renderHook(() => useCloseOnScrollAway(anchorAt(top), close));

		top.value = 200;
		window.dispatchEvent(new Event('scroll'));
		expect(close).toHaveBeenCalledTimes(1);
	});

	it('stays open when something else scrolls or the anchor barely moves', () => {
		const top = { value: 300 };
		const close = jest.fn();
		renderHook(() => useCloseOnScrollAway(anchorAt(top), close));

		window.dispatchEvent(new Event('scroll'));
		top.value = 290;
		window.dispatchEvent(new Event('scroll'));
		expect(close).not.toHaveBeenCalled();
	});

	it('listens only while there is an anchor', () => {
		const close = jest.fn();
		renderHook(() => useCloseOnScrollAway(null, close));
		window.dispatchEvent(new Event('scroll'));
		expect(close).not.toHaveBeenCalled();
	});
});
