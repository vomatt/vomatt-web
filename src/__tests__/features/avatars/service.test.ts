import { chooseAvatar } from '@/features/avatars/service';

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

	it.each(['unicorn', 'https://example.com/me.png'])('refuses %p without a request', async (kind) => {
		expect((await chooseAvatar(kind)).ok).toBe(false);
		expect(mockApiClient).not.toHaveBeenCalled();
	});

	it("returns the API's message instead of throwing", async () => {
		mockApiClient.mockRejectedValueOnce(new Error('Nope'));
		expect(await chooseAvatar('boba')).toEqual({ ok: false, message: 'Nope' });
	});
});
