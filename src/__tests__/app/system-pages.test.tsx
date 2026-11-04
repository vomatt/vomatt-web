import { fireEvent, render, screen } from '@testing-library/react';

import ErrorPage from '@/app/(frontend)/error';
import NotFound from '@/app/(frontend)/not-found';
import GlobalError from '@/app/global-error';

jest.mock('next/link', () => {
	const Link = ({ href, children, ...rest }: any) => (
		<a href={href} {...rest}>
			{children}
		</a>
	);
	return { __esModule: true, default: Link };
});

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

describe('404 page', () => {
	it('titles the page and offers the way home', async () => {
		render(await NotFound());
		expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
		expect(screen.getByText('We couldn’t find what you were looking for.')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
	});
});

describe('Error page', () => {
	beforeEach(() => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('says what to do without showing the raw error', () => {
		render(<ErrorPage error={new Error('fetch failed: ECONNREFUSED')} retry={jest.fn()} />);
		expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
		expect(
			screen.getByText('Please try again. If it keeps happening, come back in a few minutes.')
		).toBeInTheDocument();
		expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
	});

	it('tries again by refetching the page', () => {
		const retry = jest.fn();
		render(<ErrorPage error={new Error('boom')} retry={retry} />);
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(retry).toHaveBeenCalled();
	});
});

describe('Global error page', () => {
	let consoleError: jest.SpyInstance;
	beforeEach(() => {
		consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	// It replaces the root layout, so it can't know the reader's language
	it('says what happened in English and Chinese', () => {
		render(<GlobalError error={new Error('boom')} retry={jest.fn()} />);
		expect(screen.getByRole('heading', { level: 1, name: /Something went wrong/ })).toHaveTextContent('發生錯誤');
		expect(screen.getByRole('button', { name: /Try again/ })).toHaveTextContent('再試一次');
	});

	it('logs the error', () => {
		const error = new Error('boom');
		render(<GlobalError error={error} retry={jest.fn()} />);
		expect(consoleError).toHaveBeenCalledWith(error);
	});

	it('tries again by refetching the page', () => {
		const retry = jest.fn();
		render(<GlobalError error={new Error('boom')} retry={retry} />);
		fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
		expect(retry).toHaveBeenCalled();
	});
});
