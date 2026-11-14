import { getAnnouncement } from '@/features/announcement/data';
import { sanityFetch } from '@/sanity/lib/live';

jest.mock('@/sanity/lib/live', () => ({ sanityFetch: jest.fn() }));

const mockSanityFetch = sanityFetch as jest.MockedFunction<typeof sanityFetch>;
const block = (text: string) => ({ _type: 'block', _key: text, children: [{ _type: 'span', _key: `${text}-s`, text }], markDefs: [] });

beforeEach(() => jest.resetAllMocks());

describe('getAnnouncement', () => {
	it('returns the announcement with both messages', async () => {
		mockSanityFetch.mockResolvedValue({ data: { id: 'rev1', message: [block('Hello')], messageZh: [block('你好')] } });
		await expect(getAnnouncement()).resolves.toEqual({ id: 'rev1', message: [block('Hello')], messageZh: [block('你好')] });
	});

	it('treats an empty Chinese message as none', async () => {
		mockSanityFetch.mockResolvedValue({ data: { id: 'rev1', message: [block('Hello')], messageZh: [] } });
		await expect(getAnnouncement()).resolves.toEqual({ id: 'rev1', message: [block('Hello')], messageZh: null });
	});

	it('returns null when no announcement is on', async () => {
		mockSanityFetch.mockResolvedValue({ data: null });
		await expect(getAnnouncement()).resolves.toBeNull();
	});

	it('returns null when the English message is empty', async () => {
		mockSanityFetch.mockResolvedValue({ data: { id: 'rev1', message: null, messageZh: [block('你好')] } });
		await expect(getAnnouncement()).resolves.toBeNull();
	});

	it('returns null when Sanity fails', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		mockSanityFetch.mockRejectedValue(new Error('down'));
		await expect(getAnnouncement()).resolves.toBeNull();
	});
});
