import { ICO_ENTRY_SIZE, ICO_HEADER_SIZE, packIco } from '@/lib/brand/ico';

const png = (byte: number, length: number) => Buffer.alloc(length, byte);

describe('packIco', () => {
	it('writes the header, one directory entry per image and the data in order', () => {
		const small = png(0xaa, 10);
		const large = png(0xbb, 25);
		const ico = packIco([
			{ size: 16, data: small },
			{ size: 32, data: large },
		]);

		expect(ico.readUInt16LE(0)).toBe(0); // reserved
		expect(ico.readUInt16LE(2)).toBe(1); // icon type
		expect(ico.readUInt16LE(4)).toBe(2); // image count

		const first = ICO_HEADER_SIZE;
		const second = first + ICO_ENTRY_SIZE;
		const dataStart = ICO_HEADER_SIZE + 2 * ICO_ENTRY_SIZE;
		expect([ico.readUInt8(first), ico.readUInt8(first + 1)]).toEqual([16, 16]);
		expect(ico.readUInt16LE(first + 6)).toBe(32); // bits per pixel
		expect(ico.readUInt32LE(first + 8)).toBe(10);
		expect(ico.readUInt32LE(first + 12)).toBe(dataStart);
		expect([ico.readUInt8(second), ico.readUInt8(second + 1)]).toEqual([32, 32]);
		expect(ico.readUInt32LE(second + 8)).toBe(25);
		expect(ico.readUInt32LE(second + 12)).toBe(dataStart + 10);

		expect(ico.subarray(dataStart, dataStart + 10).equals(small)).toBe(true);
		expect(ico.subarray(dataStart + 10).equals(large)).toBe(true);
		expect(ico.length).toBe(dataStart + 35);
	});

	it('encodes a 256px image as 0, the way the format spells 256', () => {
		const ico = packIco([{ size: 256, data: png(0, 4) }]);
		expect([ico.readUInt8(ICO_HEADER_SIZE), ico.readUInt8(ICO_HEADER_SIZE + 1)]).toEqual([0, 0]);
	});

	it('rejects sizes the directory cannot hold', () => {
		expect(() => packIco([{ size: 512, data: png(0, 4) }])).toThrow(RangeError);
		expect(() => packIco([{ size: 0, data: png(0, 4) }])).toThrow(RangeError);
	});
});
