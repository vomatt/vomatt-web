import { chooseAvatar, uploadAvatar } from '@/features/avatars/service';

const mockUpdateTag = jest.fn();
jest.mock('next/cache', () => ({ updateTag: (...a: unknown[]) => mockUpdateTag(...a) }));
jest.mock('next/navigation', () => ({ unstable_rethrow: jest.fn() }));
const mockApiClient = jest.fn();
jest.mock('@/lib/api/client', () => ({
	apiClient: (...a: unknown[]) => mockApiClient(...a),
	ApiError: class extends Error {},
	AuthError: class extends Error {},
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockApiClient.mockResolvedValue({});
});

describe('chooseAvatar()', () => {
	it('saves the kind as bot:<kind> and refreshes profiles', async () => {
		expect(await chooseAvatar('boba')).toEqual({ ok: true, data: undefined });
		expect(mockApiClient).toHaveBeenCalledWith('/users/me', {
			method: 'PATCH',
			body: JSON.stringify({ avatarUrl: 'bot:boba' }),
		});
		expect(mockUpdateTag).toHaveBeenCalledWith('profiles');
	});

	it('saves no character as bot:none', async () => {
		expect((await chooseAvatar('none')).ok).toBe(true);
		expect(mockApiClient).toHaveBeenCalledWith('/users/me', {
			method: 'PATCH',
			body: JSON.stringify({ avatarUrl: 'bot:none' }),
		});
	});

	it.each(['unicorn', 'https://example.com/me.png'])('refuses %p without a request', async (kind) => {
		expect((await chooseAvatar(kind)).ok).toBe(false);
		expect(mockApiClient).not.toHaveBeenCalled();
	});

	it("returns the API's message instead of throwing", async () => {
		mockApiClient.mockRejectedValueOnce(new Error('Nope'));
		expect(await chooseAvatar('boba')).toEqual({ ok: false, message: 'Nope' });
	});
});

describe('uploadAvatar()', () => {
	it('sends the file as multipart to PUT /users/me/avatar and refreshes profiles', async () => {
		const formData = new FormData();
		formData.set('file', new File(['x'], 'me.png', { type: 'image/png' }));
		expect(await uploadAvatar(formData)).toEqual({ ok: true, data: undefined });
		const [path, options] = mockApiClient.mock.calls[0];
		expect(path).toBe('/users/me/avatar');
		expect(options.method).toBe('PUT');
		expect(options.isFormData).toBe(true);
		expect((options.body as FormData).get('file')).toBeInstanceOf(File);
		expect(mockUpdateTag).toHaveBeenCalledWith('profiles');
	});

	it('refuses a missing or empty file without a request', async () => {
		const empty = new FormData();
		empty.set('file', new File([], 'empty.png'));
		expect((await uploadAvatar(new FormData())).ok).toBe(false);
		expect((await uploadAvatar(empty)).ok).toBe(false);
		expect(mockApiClient).not.toHaveBeenCalled();
	});
});
