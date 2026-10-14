jest.mock('sanity', () => ({ useFormValue: jest.fn() }));
jest.mock('@sanity/ui', () => ({}));

import { getUrl } from '@/sanity/schemaTypes/components/SlugField';

// jsdom serves the test page from http://localhost
describe('SlugField getUrl', () => {
	it('links a general page to its slug on the site origin', () => {
		expect(getUrl({ docType: 'pGeneral', slug: 'about' })).toBe(
			'http://localhost/about'
		);
	});

	it('links the homepage to the site root', () => {
		expect(getUrl({ docType: 'pHome', slug: '/' })).toBe('http://localhost/');
	});

	it('links the log-in page to /login', () => {
		expect(getUrl({ docType: 'pSignUp', slug: '/login' })).toBe(
			'http://localhost/login'
		);
	});

	it('links the homepage even when its slug is empty', () => {
		expect(getUrl({ docType: 'pHome', slug: undefined })).toBe('http://localhost/');
	});

	it('has no link before a slug is set', () => {
		expect(getUrl({ docType: 'pGeneral', slug: undefined })).toBeUndefined();
	});

	it('has no link for a type without a page route', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		expect(getUrl({ docType: 'p404', slug: 'not-found' })).toBeUndefined();
		warn.mockRestore();
	});
});
