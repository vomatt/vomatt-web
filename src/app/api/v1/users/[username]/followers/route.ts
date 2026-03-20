import { NextRequest, NextResponse } from 'next/server';

import { getFollowersList, getUserSummaries, MOCK_USERS } from '../../_mock-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { username } = await params;
  if (!MOCK_USERS.some((u) => u.username === username)) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const size = parseInt(searchParams.get('size') ?? '20', 10);

  const all = getFollowersList(username);
  const start = page * size;
  const content = getUserSummaries(all.slice(start, start + size));

  return NextResponse.json({
    success: true,
    data: {
      content,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
      size,
    },
  });
}
