/**
 * Packs PNG images into an ICO container. Every current browser reads PNG
 * entries, so no BMP conversion is needed. Format: a 6-byte header, a 16-byte
 * directory entry per image, then the image data back to back.
 */

export interface IcoImage {
	/** Pixel size of the square image, 1..256. */
	size: number;
	/** The PNG file bytes. */
	data: Buffer;
}

export const ICO_HEADER_SIZE = 6;
export const ICO_ENTRY_SIZE = 16;

export function packIco(images: IcoImage[]): Buffer {
	const header = Buffer.alloc(ICO_HEADER_SIZE);
	header.writeUInt16LE(0, 0); // reserved
	header.writeUInt16LE(1, 2); // type: icon
	header.writeUInt16LE(images.length, 4);
	const directory = Buffer.alloc(ICO_ENTRY_SIZE * images.length);
	let offset = header.length + directory.length;
	images.forEach(({ size, data }, index) => {
		if (!Number.isInteger(size) || size < 1 || size > 256) {
			throw new RangeError(`ICO image size must be 1..256, got ${size}`);
		}
		const entry = index * ICO_ENTRY_SIZE;
		const sizeByte = size === 256 ? 0 : size; // the format writes 256 as 0
		directory.writeUInt8(sizeByte, entry); // width
		directory.writeUInt8(sizeByte, entry + 1); // height
		directory.writeUInt8(0, entry + 2); // palette
		directory.writeUInt8(0, entry + 3); // reserved
		directory.writeUInt16LE(1, entry + 4); // colour planes
		directory.writeUInt16LE(32, entry + 6); // bits per pixel
		directory.writeUInt32LE(data.length, entry + 8);
		directory.writeUInt32LE(offset, entry + 12);
		offset += data.length;
	});
	return Buffer.concat([header, directory, ...images.map((image) => image.data)]);
}
