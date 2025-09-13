import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const { language } = await request.json();

		// Here you would typically:
		// 1. Verify user authentication
		// 2. Update user's language preference in your database
		// 3. Return success response

		// Example database update (replace with your actual database logic):
		// await db.user.update({
		//   where: { id: userId },
		//   data: { preferredLanguage: language }
		// });

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to update language preference' },
			{ status: 500 }
		);
	}
}

// Usage in a page component after user authentication:
// const user = useUser(); // Your authentication hook
// useUserLanguage(user?.preferredLanguage);

// 7. Utility function for server-side language detection
// utils/languageDetection.ts
import { NextRequest } from 'next/server';

export function detectServerLanguage(request: NextRequest): string {
	// Check for language preference in cookie (if you want to set one)
	const cookieLanguage = request.cookies.get('preferred-language')?.value;
	if (cookieLanguage) return cookieLanguage;

	// Fallback to Accept-Language header
	const acceptLanguage = request.headers.get('accept-language');
	if (acceptLanguage) {
		const preferredLang = acceptLanguage.split(',')[0].split('-')[0];
		const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko'];
		return supportedLanguages.includes(preferredLang) ? preferredLang : 'en';
	}

	return 'en';
}
