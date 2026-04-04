import { NextRequest, NextResponse } from 'next/server';

import { decodeToken } from '@/lib/api/auth';
import { follows, MOCK_USERS } from '../../_mock-store';

async function getCallerUsername(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = await decodeToken(token);
  return payload?.username ?? null;
}

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

function err(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const [{ username }, caller] = await Promise.all([params, getCallerUsername(req)]);
  if (!caller) return err('Not authenticated', 401);
  if (caller === username) return err('Cannot follow yourself', 400);

  const targetExists = MOCK_USERS.some((u) => u.username === username);
  if (!targetExists) return err('User not found', 404);

  if (!follows.has(caller)) follows.set(caller, new Set());
  follows.get(caller)!.add(username);

  return ok({ following: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const [{ username }, caller] = await Promise.all([params, getCallerUsername(req)]);
  if (!caller) return err('Not authenticated', 401);

  // Idempotent: delete regardless of whether they were following
  follows.get(caller)?.delete(username);

  return ok({ following: false });
}
