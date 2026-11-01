/**
 * Who the user is, for calls this server makes to vomatt-api on their behalf.
 * The API sees this server on every call, so without these headers its per-IP
 * rate limits and OTP lockouts would treat all users as one, and every
 * session's device (kept from the User-Agent at sign-in and on each refresh)
 * would be this server. The secret proves the IP comes from here (vomatt-api's
 * ClientIpResolver). On Vercel, `x-forwarded-for` is set by the platform, not
 * the browser.
 */
export function clientHeaders(requestHeaders: Headers): Record<string, string> {
	const result: Record<string, string> = {};
	const userAgent = requestHeaders.get('user-agent');
	if (userAgent) result['User-Agent'] = userAgent;
	const secret = process.env.CLIENT_IP_SECRET;
	const ip =
		requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		requestHeaders.get('x-real-ip')?.trim();
	if (secret && ip) Object.assign(result, { 'X-Client-IP': ip, 'X-Client-IP-Secret': secret });
	return result;
}
