import { act, render, screen } from '@testing-library/react';

import { Header } from '@/components/layout/Header';

let mockPathname = '/';
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
}));

function scrollTo(y: number) {
	act(() => {
		window.scrollY = y;
		window.dispatchEvent(new Event('scroll'));
	});
}

let mockIsMobile = true;
jest.mock('@/hooks/use-mobile', () => ({
	useIsMobile: () => mockIsMobile,
}));

function header() {
	return document.querySelector('[data-mobile-header]');
}

describe('Header', () => {
	beforeEach(() => {
		mockPathname = '/';
		mockIsMobile = true;
		window.scrollY = 0;
		Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true });
	});

	it('links the logo home', () => {
		render(<Header />);
		expect(screen.getByRole('link', { name: 'vomatt' })).toHaveAttribute('href', '/');
	});

	it('hides when scrolling down past the header', () => {
		render(<Header />);
		scrollTo(200);
		expect(header()).toHaveAttribute('data-hidden');
	});

	it('shows again when scrolling up', () => {
		render(<Header />);
		scrollTo(400);
		scrollTo(300);
		expect(header()).not.toHaveAttribute('data-hidden');
	});

	it('ignores small upward jitter', () => {
		render(<Header />);
		scrollTo(400);
		scrollTo(395);
		expect(header()).toHaveAttribute('data-hidden');
	});

	it('stays hidden through the bounce at the bottom of the page', () => {
		const bottom = 5000 - window.innerHeight;
		render(<Header />);
		scrollTo(bottom - 100);
		scrollTo(bottom + 30);
		scrollTo(bottom);
		expect(header()).toHaveAttribute('data-hidden');
	});

	it('never hides on desktop, where the sidebar replaces it', () => {
		mockIsMobile = false;
		render(<Header />);
		scrollTo(200);
		expect(header()).not.toHaveAttribute('data-hidden');
	});

	it('stays shown near the top of the page', () => {
		render(<Header />);
		scrollTo(20);
		expect(header()).not.toHaveAttribute('data-hidden');
	});

	it('is left out on /login, which has its own logo', () => {
		mockPathname = '/login';
		render(<Header />);
		expect(header()).toBeNull();
	});
});
