import { NextResponse } from 'next/server';

export async function GET() {
	const data = { message: 'hello' };
	return NextResponse.json(data);
}
