import { isFieldPublic } from '@/features/account/visibility';

describe('isFieldPublic()', () => {
	it('follows the saved setting', () => {
		expect(isFieldPublic({ displayName: false, location: true }, 'displayName')).toBe(false);
		expect(isFieldPublic({ displayName: false, location: true }, 'location')).toBe(true);
	});

	it('falls back to the API defaults: display name and bio public, the rest hidden', () => {
		expect(isFieldPublic({}, 'displayName')).toBe(true);
		expect(isFieldPublic({}, 'bio')).toBe(true);
		expect(isFieldPublic({}, 'points')).toBe(false);
	});
});
