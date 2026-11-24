const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = BigInt(ALPHABET.length);
const ZERO = BigInt(0);
const MAX = BigInt(`0x${'f'.repeat(32)}`);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_ID = /^[0-9A-Za-z]{1,22}$/;

/** A Poll's UUID as base62 for its link: 21 or 22 characters instead of 36, and the same 128 bits. */
export function toShortId(uuid: string): string {
	if (!UUID.test(uuid)) throw new Error(`Poll id is not a UUID: ${uuid}`);
	let n = BigInt(`0x${uuid.replace(/-/g, '')}`);
	let out = '';
	do {
		out = ALPHABET[Number(n % BASE)] + out;
		n /= BASE;
	} while (n > ZERO);
	return out;
}

/** The UUID a short id stands for, or null when it isn't one toShortId would write (so each Poll has one link). */
export function fromShortId(shortId: string): string | null {
	if (!SHORT_ID.test(shortId)) return null;
	let n = ZERO;
	for (const char of shortId) n = n * BASE + BigInt(ALPHABET.indexOf(char));
	if (n > MAX) return null;
	const hex = n.toString(16).padStart(32, '0');
	const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	return toShortId(uuid) === shortId ? uuid : null;
}

export const isUuid = (value: string) => UUID.test(value);
