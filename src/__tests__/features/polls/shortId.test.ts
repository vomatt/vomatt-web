const { fromShortId, toShortId } = jest.requireActual<typeof import('@/features/polls/shortId')>('@/features/polls/shortId');

const POLL_ID = '0199f2a3-5b7e-7d40-a1c8-9e3b2f6d4c05';

describe('short poll ids', () => {
	it('shortens a UUIDv7 to 22 characters or fewer, letters and digits only', () => {
		expect(toShortId(POLL_ID)).toMatch(/^[0-9A-Za-z]{1,22}$/);
	});

	it.each([POLL_ID, '00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff'])('reads %s back from its short id', (id) => {
		expect(fromShortId(toShortId(id))).toBe(id);
	});

	it('gives an upper-case UUID the same short id as its lower-case form', () => {
		expect(toShortId(POLL_ID.toUpperCase())).toBe(toShortId(POLL_ID));
	});

	it('refuses a value that is not a UUID', () => {
		expect(() => toShortId('poll-1')).toThrow('Poll id is not a UUID: poll-1');
	});

	it.each([
		['a leading zero', `0${toShortId(POLL_ID)}`],
		['more than 128 bits', 'z'.repeat(22)],
		['a character outside base62', `${toShortId(POLL_ID).slice(0, -1)}-`],
		['nothing', ''],
	])('reads no poll id from a short id with %s', (_, shortId) => {
		expect(fromShortId(shortId)).toBeNull();
	});
});
