import { fireEvent, render, screen } from '@testing-library/react';

import ErrorPage from '@/app/(frontend)/error';
import NotFound from '@/app/(frontend)/not-found';

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
		render(<ErrorPage error={new Error('fetch failed: ECONNREFUSED')} reset={jest.fn()} />);
		expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
		expect(
			screen.getByText('Please try again. If it keeps happening, come back in a few minutes.')
		).toBeInTheDocument();
		expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
	});

	it('tries again', () => {
		const reset = jest.fn();
		render(<ErrorPage error={new Error('boom')} reset={reset} />);
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(reset).toHaveBeenCalled();
	});
});
