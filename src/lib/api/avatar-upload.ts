import { API_BASE_PATH } from '@/lib/api/constants';

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(`${baseUrl}${API_BASE_PATH}/users/me/avatar`, {
    method: 'PATCH',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? 'Upload failed');
  }

  const body = await res.json();
  return body.data ?? body;
}
