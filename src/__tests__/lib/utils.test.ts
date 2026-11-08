import { getSafeRedirectPath, isActivePath, profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

describe('cn', () => {
	it('merges class names', () => {
		expect(cn('foo', 'bar')).toBe('foo bar');
	});

	it('resolves Tailwind conflicts in favour of the last value', () => {
		expect(cn('p-4', 'p-8')).toBe('p-8');
	});

	it('ignores falsy values', () => {
		expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
	});

	it('supports conditional objects', () => {
		expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe(
			'text-red-500'
		);
	});
});

describe('isActivePath', () => {
	it('marks home active only on home', () => {
		expect(isActivePath('/', '/')).toBe(true);
		expect(isActivePath('/explore', '/')).toBe(false);
	});

	it('marks a section active on its pages below it', () => {
		expect(isActivePath('/my-polls', '/my-polls')).toBe(true);
		expect(isActivePath('/my-polls/drafts', '/my-polls')).toBe(true);
		expect(isActivePath('/explore', '/my-polls')).toBe(false);
	});

	it('does not mark a section active on a sibling that shares its prefix', () => {
		expect(isActivePath('/abc', '/ab')).toBe(false);
		expect(isActivePath('/about', '/a')).toBe(false);
	});
});

describe('profileHref', () => {
	it('puts the profile at the root', () => {
		expect(profileHref('klaus')).toBe('/klaus');
	});

	it('encodes characters that are not safe in a path', () => {
		expect(profileHref('a/b')).toBe('/a%2Fb');
	});
});

describe('getSafeRedirectPath', () => {
	it('keeps a same-origin path', () => {
		expect(getSafeRedirectPath('/my-polls?tab=1')).toBe('/my-polls?tab=1');
	});

	it.each([null, '', 'https://evil.com', '//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com'])(
		'falls back to / for %p',
		(input) => {
			expect(getSafeRedirectPath(input)).toBe('/');
		}
	);
});
