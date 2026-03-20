import { render, screen } from '@testing-library/react';

jest.mock('@/hooks/useAvatarUpload', () => ({
  useAvatarUpload: jest.fn(() => ({
    avatarUrl: null,
    isUploading: false,
    upload: jest.fn(),
    remove: jest.fn(),
  })),
}));

import AvatarUploader from '@/app/(frontend)/profile/[username]/_components/AvatarUploader';
const { useAvatarUpload } = require('@/hooks/useAvatarUpload');

describe('AvatarUploader', () => {
  beforeEach(() => {
    useAvatarUpload.mockReturnValue({
      avatarUrl: null,
      isUploading: false,
      upload: jest.fn(),
      remove: jest.fn(),
    });
  });

  it('renders gradient placeholder when avatarUrl is null', () => {
    render(<AvatarUploader initialAvatarUrl={null} isOwner={false} />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders img when avatarUrl is set', () => {
    useAvatarUpload.mockReturnValue({
      avatarUrl: 'https://example.com/avatar.jpg',
      isUploading: false,
      upload: jest.fn(),
      remove: jest.fn(),
    });
    render(
      <AvatarUploader
        initialAvatarUrl="https://example.com/avatar.jpg"
        isOwner={false}
      />
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    );
  });

  it('renders hidden file input when isOwner is true', () => {
    render(<AvatarUploader initialAvatarUrl={null} isOwner={true} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
  });

  it('does not render file input when isOwner is false', () => {
    render(<AvatarUploader initialAvatarUrl={null} isOwner={false} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeNull();
  });
});
