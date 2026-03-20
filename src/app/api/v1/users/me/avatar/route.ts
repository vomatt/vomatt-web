import { NextRequest, NextResponse } from 'next/server';

import { decodeToken } from '@/lib/api/auth';
import { avatars } from '../../_mock-store';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

function err(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

async function getCallerUsername(req: NextRequest): Promise<string | null> {
  // Try Authorization header first (used by apiClient-based calls)
  const auth = req.headers.get('authorization');
  const headerToken = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  // Fall back to ACCESS_TOKEN cookie (sent automatically via credentials: 'include')
  const token = headerToken ?? req.cookies.get('ACCESS_TOKEN')?.value ?? null;
  if (!token) return null;
  const payload = await decodeToken(token);
  return payload?.username ?? null;
}

export async function PATCH(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const caller = await getCallerUsername(req);
  if (!caller) return err('Not authenticated', 401);

  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof Blob)) return err('No file provided', 400);
  if (!ALLOWED_TYPES.includes(file.type)) return err('Invalid file type', 400);
  if (file.size > MAX_SIZE_BYTES) return err('File too large', 400);

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const avatarUrl = `data:${file.type};base64,${base64}`;

  avatars.set(caller, avatarUrl);

  return ok({ avatarUrl });
}

export async function DELETE(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const caller = await getCallerUsername(req);
  if (!caller) return err('Not authenticated', 401);

  // Idempotent: delete regardless of whether an avatar exists
  avatars.delete(caller);

  return ok({ avatarUrl: null });
}
