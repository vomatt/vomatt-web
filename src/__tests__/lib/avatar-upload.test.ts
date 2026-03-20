import { uploadAvatar } from '@/lib/api/avatar-upload';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
});

describe('uploadAvatar()', () => {
  it('calls PATCH /api/v1/users/me/avatar with FormData', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { avatarUrl: 'http://example.com/a.jpg' } }),
    });

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await uploadAvatar(file);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/users/me/avatar',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
      })
    );
    expect(result).toEqual({ avatarUrl: 'http://example.com/a.jpg' });
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'File too large' }),
    });

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(uploadAvatar(file)).rejects.toThrow('File too large');
  });

  it('appends file under the key "file"', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { avatarUrl: 'x' } }),
    });

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await uploadAvatar(file);

    const [, options] = mockFetch.mock.calls[0];
    const body = options.body as FormData;
    expect(body.get('file')).toBe(file);
  });
});
