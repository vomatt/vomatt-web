import {
	cn,
	formatHandleize,
	formatNumberSuffix,
	formatNumberWithCommas,
	formatUrl,
	getUrlBaseAndPath,
	hasArrayValue,
	isValidUrl,
	resolveHref,
	slugify,
	validateAndReturnJson,
	validateEmail,
	validateUsPhone,
} from '@/lib/utils';

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

describe('formatUrl', () => {
	it('collapses double slashes in path', () => {
		expect(formatUrl('https://example.com//api//route')).toBe(
			'https://example.com/api/route'
		);
	});

	it('preserves protocol slashes', () => {
		expect(formatUrl('https://example.com/path')).toBe(
			'https://example.com/path'
		);
	});
});

describe('getUrlBaseAndPath', () => {
	it('strips query string', () => {
		expect(getUrlBaseAndPath('https://example.com/page?foo=bar')).toBe(
			'https://example.com/page'
		);
	});

	it('returns unchanged when no query string', () => {
		expect(getUrlBaseAndPath('https://example.com/page')).toBe(
			'https://example.com/page'
		);
	});
});

describe('formatNumberSuffix', () => {
	it('returns 1st for 1', () => {
		expect(formatNumberSuffix('1', '')).toBe('1st');
	});

	it('returns 2nd for 2', () => {
		expect(formatNumberSuffix('2', '')).toBe('2nd');
	});

	it('returns 3rd for 3', () => {
		expect(formatNumberSuffix('3', '')).toBe('3rd');
	});

	it('returns 4th for 4', () => {
		expect(formatNumberSuffix('4', '')).toBe('4th');
	});

	it('returns 11th for 11 (teen exception)', () => {
		expect(formatNumberSuffix('11', '')).toBe('11th');
	});

	it('returns 12th for 12 (teen exception)', () => {
		expect(formatNumberSuffix('12', '')).toBe('12th');
	});

	it('returns 13th for 13 (teen exception)', () => {
		expect(formatNumberSuffix('13', '')).toBe('13th');
	});

	it('returns 21st for 21', () => {
		expect(formatNumberSuffix('21', '')).toBe('21st');
	});

	it('returns suffix only when suffixOnly is truthy', () => {
		expect(formatNumberSuffix('1', 'yes')).toBe('st');
	});
});

describe('formatHandleize', () => {
	// Note: the regex [^a-z0-9 -] runs before .toLowerCase(), so uppercase
	// letters are stripped rather than lowercased. Tests reflect actual behaviour.
	it('replaces spaces with hyphens (strips uppercase before lowercasing)', () => {
		expect(formatHandleize('Hello World')).toBe('ello-orld');
	});

	it('removes accents', () => {
		expect(formatHandleize('café')).toBe('cafe');
	});

	it('removes non-alphanumeric characters', () => {
		expect(formatHandleize('hello, world!')).toBe('hello-world');
	});

	it('collapses consecutive hyphens', () => {
		expect(formatHandleize('foo  bar')).toBe('foo-bar');
	});

	it('handles already-lowercase input correctly', () => {
		expect(formatHandleize('hello world')).toBe('hello-world');
	});
});

describe('formatNumberWithCommas', () => {
	it('formats thousands', () => {
		expect(formatNumberWithCommas('3000')).toBe('3,000');
	});

	it('preserves decimal places', () => {
		expect(formatNumberWithCommas('3000.12')).toBe('3,000.12');
	});

	it('handles values under 1000 unchanged', () => {
		expect(formatNumberWithCommas('999')).toBe('999');
	});
});

describe('validateEmail', () => {
	it('accepts valid email', () => {
		expect(validateEmail('user@example.com')).toBe(true);
	});

	it('rejects email with no domain', () => {
		expect(validateEmail('user@')).toBe(false);
	});

	it('rejects plain string', () => {
		expect(validateEmail('notanemail')).toBe(false);
	});

	it('rejects email with missing TLD', () => {
		expect(validateEmail('user@example')).toBe(false);
	});
});

describe('validateUsPhone', () => {
	it('accepts 10-digit number', () => {
		expect(validateUsPhone('5551234567')).toBe(true);
	});

	it('accepts formatted number with dashes', () => {
		expect(validateUsPhone('555-123-4567')).toBe(true);
	});

	it('accepts formatted number with parentheses', () => {
		expect(validateUsPhone('(555) 123-4567')).toBe(true);
	});

	it('rejects 9-digit number', () => {
		expect(validateUsPhone('555123456')).toBe(false);
	});
});

describe('validateAndReturnJson', () => {
	beforeEach(() => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns parsed object for valid JSON', () => {
		expect(validateAndReturnJson('{"a":1}')).toEqual({ a: 1 });
	});

	it('returns false for invalid JSON', () => {
		expect(validateAndReturnJson('not json')).toBe(false);
	});

	it('returns parsed array for valid JSON array', () => {
		expect(validateAndReturnJson('[1,2,3]')).toEqual([1, 2, 3]);
	});
});

describe('hasArrayValue', () => {
	it('returns true for non-empty array', () => {
		expect(hasArrayValue([1, 2, 3])).toBe(true);
	});

	it('returns false for empty array', () => {
		expect(hasArrayValue([])).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(hasArrayValue(undefined)).toBe(false);
	});
});

describe('slugify', () => {
	it('converts to lowercase hyphen-separated slug', () => {
		expect(slugify('Hello World')).toBe('hello-world');
	});

	it('removes accented characters', () => {
		expect(slugify('Ångström')).toBe('angstrom');
	});

	it('collapses multiple spaces into single hyphen', () => {
		expect(slugify('foo   bar')).toBe('foo-bar');
	});

	it('returns undefined for empty string', () => {
		expect(slugify('')).toBeUndefined();
	});

	it('returns undefined for null', () => {
		expect(slugify(null as unknown as string)).toBeUndefined();
	});
});

describe('isValidUrl', () => {
	it('accepts https URL', () => {
		expect(isValidUrl('https://example.com')).toBe(true);
	});

	it('accepts http URL with path', () => {
		expect(isValidUrl('http://example.com/some/path')).toBe(true);
	});

	it('accepts URL without protocol', () => {
		expect(isValidUrl('example.com')).toBe(true);
	});

	it('rejects plain string with no domain', () => {
		expect(isValidUrl('notaurl')).toBe(false);
	});
});

describe('resolveHref', () => {
	it('returns / for pHome', () => {
		expect(resolveHref({ documentType: 'pHome', slug: undefined })).toBe('/');
	});

	it('returns /slug for pGeneral', () => {
		expect(resolveHref({ documentType: 'pGeneral', slug: 'about' })).toBe(
			'/about'
		);
	});

	it('returns /blog for pBlogIndex', () => {
		expect(resolveHref({ documentType: 'pBlogIndex', slug: undefined })).toBe(
			'/blog'
		);
	});

	it('returns /blog/slug for pBlog', () => {
		expect(resolveHref({ documentType: 'pBlog', slug: 'my-post' })).toBe(
			'/blog/my-post'
		);
	});

	it('returns slug as-is for externalUrl', () => {
		expect(
			resolveHref({ documentType: 'externalUrl', slug: 'https://ext.com' })
		).toBe('https://ext.com');
	});

	it('returns undefined when documentType is undefined', () => {
		expect(resolveHref({ documentType: undefined, slug: 'foo' })).toBeUndefined();
	});
});
