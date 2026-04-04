import { NextRequest, NextResponse } from 'next/server';

import { decodeToken } from '@/lib/api/auth';
import { getEnrichedProfile } from '../_mock-store';

async function getCallerUsername(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = await decodeToken(token);
  return payload?.username ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const [{ username }, caller] = await Promise.all([params, getCallerUsername(req)]);
  const profile = getEnrichedProfile(username, caller);

  if (!profile) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: profile });
}
