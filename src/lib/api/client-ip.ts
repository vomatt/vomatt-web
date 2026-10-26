/**
 * vomatt-api sees this server's IP on every call, so without these headers
 * its per-IP rate limits and OTP lockouts would treat all users as one. The
 * secret proves the IP comes from here (vomatt-api's ClientIpResolver). On
 * Vercel, `x-forwarded-for` is set by the platform, not the browser.
 */
export function clientIpHeaders(requestHeaders: Headers): Record<string, string> {
	const secret = process.env.CLIENT_IP_SECRET;
	const ip =
		requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		requestHeaders.get('x-real-ip')?.trim();
	if (!secret || !ip) return {};
	return { 'X-Client-IP': ip, 'X-Client-IP-Secret': secret };
}
