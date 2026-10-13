import { isOwnUsername, isValidUsername, usernameFromSlug } from '@/features/account/username';

describe('usernameFromSlug', () => {
	it('decodes a percent-encoded slug', () => {
		expect(usernameFromSlug('j%C3%BCrgen')).toBe('jürgen');
	});

	it('returns null for a malformed slug instead of throwing', () => {
		expect(usernameFromSlug('%E0%A4%A')).toBeNull();
		expect(usernameFromSlug('%')).toBeNull();
	});
});

describe('isOwnUsername', () => {
	it('matches the viewer regardless of case', () => {
		expect(isOwnUsername({ username: 'klaus' }, 'Klaus')).toBe(true);
	});

	it('does not match another user or a guest', () => {
		expect(isOwnUsername({ username: 'klaus' }, 'klaus2')).toBe(false);
		expect(isOwnUsername(null, 'klaus')).toBe(false);
	});
});

describe('isValidUsername', () => {
	it('accepts letters, numbers and underscores', () => {
		expect(isValidUsername('chinssiang_3797')).toBe(true);
	});

	it('rejects names that are too short, too long or have other characters', () => {
		expect(isValidUsername('ab')).toBe(false);
		expect(isValidUsername('a'.repeat(31))).toBe(false);
		expect(isValidUsername('no spaces')).toBe(false);
		expect(isValidUsername('dot.name')).toBe(false);
	});
});
