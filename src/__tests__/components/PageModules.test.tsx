import { render, screen, within } from '@testing-library/react';

import PageGeneral from '@/app/(frontend)/_components/PageGeneral';
import PageModules from '@/components/PageModules';

// @portabletext/react ships ESM only, which Jest doesn't load
jest.mock('@/components/CustomPortableText', () => ({
	__esModule: true,
	default: () => null,
}));

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
});
