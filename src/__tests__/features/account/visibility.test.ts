import { isFieldPublic, visibilityChanges } from '@/features/account/visibility';

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

describe('visibilityChanges()', () => {
	it('lists only the fields whose visibility changed, defaults included', () => {
		expect(visibilityChanges({ bio: true }, { bio: true, location: true, displayName: false })).toEqual({
			location: true,
			displayName: false,
		});
	});

	it('is empty when nothing changed', () => {
		expect(visibilityChanges({}, { displayName: true, points: false })).toEqual({});
	});
});
