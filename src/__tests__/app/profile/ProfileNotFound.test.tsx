import { render, screen } from '@testing-library/react';

import ProfileNotFound from '@/app/(frontend)/[slug]/_components/ProfileNotFound';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/link', () => {
	const Link = ({ children, href }: any) => <a href={href}>{children}</a>;
	return Link;
});
let mockPathname = '/';
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));

describe('ProfileNotFound', () => {
	it('names the missing username', () => {
		mockPathname = '/old_name';
		render(<ProfileNotFound />);
		expect(screen.getByRole('heading', { name: "This profile doesn’t exist" })).toBeInTheDocument();
		expect(screen.getByText('@old_name')).toBeInTheDocument();
	});

	it('uses page wording for a slug that cannot be a username', () => {
		mockPathname = '/About-Us';
		render(<ProfileNotFound />);
		expect(screen.getByRole('heading', { name: "This page doesn’t exist" })).toBeInTheDocument();
		expect(screen.queryByText(/^@/)).not.toBeInTheDocument();
	});

	it('links to Explore and home', () => {
		mockPathname = '/old_name';
		render(<ProfileNotFound />);
		expect(screen.getByRole('link', { name: 'Explore polls' })).toHaveAttribute('href', '/explore');
		expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
	});
});
