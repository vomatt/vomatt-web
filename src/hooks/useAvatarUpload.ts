'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { uploadAvatar } from '@/lib/api/avatar-upload';
import { removeAvatar } from '@/lib/api/services/users';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface UseAvatarUploadReturn {
  avatarUrl: string | null;
  isUploading: boolean;
  /** Validates and uploads file. Returns an error message on validation failure, undefined on success. */
  upload: (file: File) => Promise<string | undefined>;
  remove: () => Promise<void>;
}

export function useAvatarUpload(initialAvatarUrl: string | null): UseAvatarUploadReturn {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File): Promise<string | undefined> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'File too large. Maximum size is 5 MB.';
    }

    setIsUploading(true);
    try {
      const result = await uploadAvatar(file);
      setAvatarUrl(result.avatarUrl);
      router.refresh();
    } finally {
      setIsUploading(false);
    }
    return undefined;
  }

  async function remove() {
    setIsUploading(true);
    try {
      await removeAvatar();
      setAvatarUrl(null);
      router.refresh();
    } finally {
      setIsUploading(false);
    }
  }

  return { avatarUrl, isUploading, upload, remove };
}
