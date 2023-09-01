import { NextResponse } from 'next/server';

export async function GET(request) {
	const data = { message: 'hello' };
	return NextResponse.json(data);
}
