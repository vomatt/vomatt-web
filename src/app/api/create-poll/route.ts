import { NextRequest, NextResponse } from 'next/server';

import { apiAuthFetch } from '@/app/api/lib/apiAuthFetch';

/*
  "title": "誰最帥",
  "description": "應該是我",
  "options": [
    {
      "text": "Eric",
      "description": "",
      "displayOrder": 0
    },
    {
      "text": "Klaus",
      "description": "",
      "displayOrder": 0
    },
    {
      "text": "Jason",
      "description": "",
      "displayOrder": 0
    }
  ],
  "startTime": "2025-08-25T13:56:22.555Z",
  "endTime": "2025-09-25T22:30:22.555Z",
  "allowMultipleChoices": true,
  "anonymous": true

*/
export async function POST(request: NextRequest) {
	const body = await request.json();

	const {
		question,
		description,
		options,
		startTime,
		endTime,
		isAllowMultipleChoices,
		isAnonymous,
	} = body;

	try {
		const bodyData = {
			title: question,
			description,
			options,
			startTime,
			endTime,
			allowMultipleChoices: isAllowMultipleChoices,
			anonymous: isAnonymous,
		};

		const response = await apiAuthFetch('/api/v1/votes', {
			method: 'POST',
			body: JSON.stringify(bodyData),
		});

		const { success, errorCode, data } = response || {};
		if (!success) {
			return NextResponse.json({
				status: 'ERROR',
				message: errorCode,
			});
		}
		return NextResponse.json({
			status: 'SUCCESS',
			message: data,
		});
	} catch (error) {
		console.log('🚀 ~ :71 ~ POST ~ error:', error);
		return NextResponse.json({
			status: 'ERROR',
			message: 'Something went wrong',
			error,
		});
	}
}
