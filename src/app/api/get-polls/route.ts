import { NextResponse } from 'next/server';

export async function GET() {
	try {
		const url = `${process.env.API_URL}/api/v1/votes`;
		const res = await fetch(url);

		return NextResponse.json({
			status: 'SUCCESS',
			// message: errorCode,
		});
	} catch (error) {
		return NextResponse.json({
			status: 'ERROR',
			message: 'Something went wrong',
			error,
		});
	}
}
