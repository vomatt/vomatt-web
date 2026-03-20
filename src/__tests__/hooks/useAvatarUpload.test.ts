import { act, renderHook } from '@testing-library/react';

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock('@/lib/api/avatar-upload', () => ({
  uploadAvatar: jest.fn(),
}));
jest.mock('@/lib/api/services/users', () => ({
  removeAvatar: jest.fn(),
}));

const { uploadAvatar } = require('@/lib/api/avatar-upload');
const { removeAvatar } = require('@/lib/api/services/users');

import { useAvatarUpload } from '@/hooks/useAvatarUpload';

beforeEach(() => {
  jest.clearAllMocks();
  uploadAvatar.mockResolvedValue({ avatarUrl: 'https://example.com/new.jpg' });
  removeAvatar.mockResolvedValue({ avatarUrl: null });
});

describe('useAvatarUpload', () => {
  it('initialises avatarUrl from prop', () => {
    const { result } = renderHook(() =>
      useAvatarUpload('https://example.com/initial.jpg')
    );
    expect(result.current.avatarUrl).toBe('https://example.com/initial.jpg');
  });

  it('starts with isUploading=false', () => {
    const { result } = renderHook(() => useAvatarUpload(null));
    expect(result.current.isUploading).toBe(false);
  });

  it('rejects files over 5 MB without calling uploadAvatar', async () => {
    const { result } = renderHook(() => useAvatarUpload(null));
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', {
      type: 'image/png',
    });
    let error: string | undefined;
    await act(async () => {
      error = await result.current.upload(bigFile);
    });
    expect(error).toMatch(/too large/i);
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('rejects disallowed MIME types without calling uploadAvatar', async () => {
    const { result } = renderHook(() => useAvatarUpload(null));
    const bad = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    let error: string | undefined;
    await act(async () => {
      error = await result.current.upload(bad);
    });
    expect(error).toMatch(/type/i);
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('calls uploadAvatar and updates avatarUrl on success', async () => {
    const { result } = renderHook(() => useAvatarUpload(null));
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.upload(file);
    });
    expect(uploadAvatar).toHaveBeenCalledWith(file);
    expect(result.current.avatarUrl).toBe('https://example.com/new.jpg');
  });

  it('calls removeAvatar and sets avatarUrl to null', async () => {
    const { result } = renderHook(() =>
      useAvatarUpload('https://example.com/old.jpg')
    );
    await act(async () => {
      await result.current.remove();
    });
    expect(removeAvatar).toHaveBeenCalled();
    expect(result.current.avatarUrl).toBeNull();
  });
});
