import { render, screen, within } from '@testing-library/react';

import PageGeneral from '@/app/(frontend)/_components/PageGeneral';
import PageModules from '@/components/PageModules';

// @portabletext/react ships ESM only, which Jest doesn't load
jest.mock('@/components/CustomPortableText', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

const link = (href: string) => ({ _type: 'link', href, isNewTab: false });

describe('PageModules', () => {
	it('makes the Hero the page title, with its buttons named by their labels', () => {
		render(
			<PageModules
				module={{
					_type: 'hero',
					_key: 'm',
					eyebrow: 'About vomatt',
					heading: 'Ask everyone.',
					intro: 'A public voting platform.',
					actions: [
						{ _key: 'a', label: 'Explore polls', link: link('/explore') },
						{ _key: 'b', label: 'How it works', link: link('/about#how') },
					],
				}}
			/>
		);
		expect(screen.getByRole('heading', { level: 1, name: 'Ask everyone.' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Explore polls' })).toHaveAttribute('href', '/explore');
		expect(screen.getByRole('link', { name: 'How it works' })).toBeInTheDocument();
	});

	it('leaves out a button that has no link', () => {
		render(<PageModules module={{ _type: 'callout', _key: 'm', heading: 'Ask', actions: [{ _key: 'a', label: 'Go' }] }} />);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it('numbers Steps in order', () => {
		render(
			<PageModules
				module={{
					_type: 'featureList',
					_key: 'm',
					heading: 'How to vote',
					layout: 'steps',
					items: [
						{ _key: '1', title: 'Find a poll' },
						{ _key: '2', title: 'Pick one option' },
					],
				}}
			/>
		);
		const steps = within(screen.getByRole('list')).getAllByRole('listitem');
		expect(steps[0]).toHaveTextContent('1Find a poll');
		expect(steps[1]).toHaveTextContent('2Pick one option');
	});

	it('names each section by its heading', () => {
		render(
			<PageModules
				module={{
					_type: 'accordionList',
					_key: 'm',
					heading: 'Tips',
					items: [{ _key: 't', title: 'Keep options short' }],
				}}
			/>
		);
		expect(screen.getByRole('region', { name: 'Tips' })).toBeInTheDocument();
		expect(screen.getByText('Keep options short')).toBeInTheDocument();
	});
});

describe('PageGeneral editor layout', () => {
	it('shows when the page was last published when the page asks for it', () => {
		render(
			<PageGeneral
				data={{
					title: 'Privacy Policy',
					layout: 'editor',
					showLastUpdated: true,
					_updatedAt: '2026-10-29T15:17:34Z',
				}}
			/>
		);
		const date = screen.getByText('October 29, 2026');
		expect(date).toHaveAttribute('dateTime', '2026-10-29T15:17:34Z');
		expect(date.closest('p')).toHaveTextContent('Last updated October 29, 2026');
	});

	it('dates the page by the day in Taiwan', () => {
		// 01:30 on October 30 in Taipei
		render(<PageGeneral data={{ title: 'Terms', layout: 'editor', showLastUpdated: true, _updatedAt: '2026-10-29T17:30:00Z' }} />);
		expect(screen.getByText('October 30, 2026')).toBeInTheDocument();
	});

	it('leaves the date out by default', () => {
		render(<PageGeneral data={{ title: 'Resources', layout: 'editor', _updatedAt: '2026-10-29T15:17:34Z' }} />);
		expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument();
	});
});

describe('PageGeneral modules layout', () => {
	it('titles the page from its title when no Hero does', () => {
		render(
			<PageGeneral
				data={{
					title: 'About',
					layout: 'modules',
					pageModules: [{ _type: 'callout', _key: 'c', heading: 'Ask the next question' }],
				}}
			/>
		);
		expect(screen.getByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument();
	});

	it('titles the page from its title when the Hero has no heading', () => {
		render(
			<PageGeneral
				data={{
					title: 'About',
					layout: 'modules',
					pageModules: [{ _type: 'hero', _key: 'h', intro: 'A public voting platform.' }],
				}}
			/>
		);
		expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
		expect(screen.getByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument();
	});

	it('leaves the title to the Hero when there is one', () => {
		render(
			<PageGeneral
				data={{
					title: 'About',
					layout: 'modules',
					pageModules: [{ _type: 'hero', _key: 'h', heading: 'Ask everyone.' }],
				}}
			/>
		);
		expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
		expect(screen.getByRole('heading', { level: 1, name: 'Ask everyone.' })).toBeInTheDocument();
	});

	it('shows no date, even when the switch was left on from the editor layout', () => {
		render(
			<PageGeneral
				data={{
					title: 'About',
					layout: 'modules',
					showLastUpdated: true,
					_updatedAt: '2026-10-29T15:17:34Z',
					pageModules: [{ _type: 'callout', _key: 'c', heading: 'Ask the next question' }],
				}}
			/>
		);
		expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument();
	});
});
