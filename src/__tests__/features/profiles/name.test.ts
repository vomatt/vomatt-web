import { profileName } from '@/features/profiles/name';

describe('profileName', () => {
	it('leads with the real name and follows it with the display name', () => {
		expect(profileName({ username: 'mei', firstName: 'Mei', lastName: 'Lin', displayName: 'Meimei' })).toEqual({
			primary: 'Mei Lin',
			secondary: 'Meimei',
		});
	});

	it('writes a Chinese name family name first, with no space', () => {
		expect(profileName({ username: 'mei', firstName: '小明', lastName: '陳' }).primary).toBe('陳小明');
	});

	it('writes a Korean name family name first, with no space', () => {
		expect(profileName({ username: 'mj', firstName: '민준', lastName: '김' }).primary).toBe('김민준');
	});

	it('keeps given name first when only one part is Chinese', () => {
		expect(profileName({ username: 'mei', firstName: 'Mei', lastName: '林' }).primary).toBe('Mei 林');
	});

	it('shows a display name that repeats the real name once', () => {
		expect(profileName({ username: 'mei', firstName: 'Mei', lastName: 'Lin', displayName: 'mei lin' })).toEqual({
			primary: 'Mei Lin',
			secondary: null,
		});
	});

	it('shows the real name alone when there is no display name', () => {
		expect(profileName({ username: 'mei', firstName: 'Mei', lastName: 'Lin', displayName: '' })).toEqual({
			primary: 'Mei Lin',
			secondary: null,
		});
	});

	it('uses whichever half of the real name is set', () => {
		expect(profileName({ username: 'mei', lastName: 'Lin' }).primary).toBe('Lin');
	});

	it('shows the display name when there is no real name', () => {
		expect(profileName({ username: 'mei', displayName: 'Meimei', firstName: null, lastName: '  ' })).toEqual({
			primary: 'Meimei',
			secondary: null,
		});
	});

	it('falls back to the username', () => {
		expect(profileName({ username: 'mei', displayName: null })).toEqual({ primary: 'mei', secondary: null });
	});
});
