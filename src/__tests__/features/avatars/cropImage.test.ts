import { cropToJpeg } from '@/features/avatars/cropImage';

// jsdom has no image decoding or 2D canvas, so both are stood in for and their calls recorded
const context = { fillStyle: '', fillRect: jest.fn(), drawImage: jest.fn() };
const toBlob = jest.fn();
let decode: jest.Mock;
let images: HTMLImageElement[];

beforeEach(() => {
	jest.clearAllMocks();
	context.fillStyle = '';
	images = [];
	decode = jest.fn().mockResolvedValue(undefined);
	jest.spyOn(window, 'Image').mockImplementation(() => {
		const image = document.createElement('img');
		image.decode = decode;
		images.push(image);
		return image;
	});
	jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
	HTMLCanvasElement.prototype.toBlob = toBlob;
	toBlob.mockImplementation((done: BlobCallback) => done(new Blob(['jpeg'], { type: 'image/jpeg' })));
});

afterEach(() => jest.restoreAllMocks());

const area = { x: 40, y: 10, width: 300, height: 300 };

describe('cropToJpeg', () => {
	it('draws the framed area onto a white 512px square and exports a JPEG at quality 0.9', async () => {
		const blob = await cropToJpeg('blob:photo', area);

		expect(images[0].src).toBe('blob:photo');
		expect(context.fillStyle).toBe('white');
		expect(context.fillRect).toHaveBeenCalledWith(0, 0, 512, 512);
		expect(context.drawImage).toHaveBeenCalledWith(images[0], 40, 10, 300, 300, 0, 0, 512, 512);
		expect(context.fillRect.mock.invocationCallOrder[0]).toBeLessThan(context.drawImage.mock.invocationCallOrder[0]);
		expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.9);
		const canvas = toBlob.mock.contexts[0] as HTMLCanvasElement;
		expect([canvas.width, canvas.height]).toEqual([512, 512]);
		expect(blob.type).toBe('image/jpeg');
	});

	it('rejects when the image cannot be decoded', async () => {
		decode.mockRejectedValue(new Error('EncodingError'));
		await expect(cropToJpeg('blob:broken', area)).rejects.toThrow();
		expect(context.drawImage).not.toHaveBeenCalled();
	});

	it('rejects when the canvas cannot encode a JPEG', async () => {
		toBlob.mockImplementation((done: BlobCallback) => done(null));
		await expect(cropToJpeg('blob:photo', area)).rejects.toThrow();
	});
});
