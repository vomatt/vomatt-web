const MAX_BODY_LENGTH = 2000;
const SECRET_KEY = /token|password|secret/i;

/**
 * `fetch` for vomatt-api calls made on the server. In `next dev` it logs each
 * request and response to the terminal; `next build` inlines NODE_ENV, so the
 * logging is dropped from production bundles. Set API_LOG=0 to silence it.
 */
export async function backendFetch(
	url: string,
	init: RequestInit = {}
): Promise<Response> {
	if (process.env.NODE_ENV !== 'development' || process.env.API_LOG === '0') {
		return fetch(url, init);
	}

	const label = `${init.method ?? 'GET'} ${url}`;
	const start = performance.now();
	try {
		const response = await fetch(url, init);
		// Read a copy in the background so the caller isn't held up by logging
		void response
			.clone()
			.text()
			.catch(() => '')
			.then((responseBody) => {
				const ms = Math.round(performance.now() - start);
				console.log(
					`[api] ${label} → ${response.status} (${ms}ms)` +
						`\n  request headers: ${formatHeaders(init.headers)}` +
						`\n  request body: ${formatBody(init.body)}` +
						`\n  response body: ${formatBody(responseBody)}`
				);
			});
		return response;
	} catch (error) {
		// Only the message: callers log or rethrow the error with its stack
		const ms = Math.round(performance.now() - start);
		const reason = error instanceof Error ? error.message : String(error);
		console.log(`[api] ${label} → failed (${ms}ms): ${reason}`);
		throw error;
	}
}

function formatHeaders(headers: HeadersInit | undefined) {
	const entries = [...new Headers(headers).entries()].map(([key, value]) =>
		key === 'authorization' ? [key, '[redacted]'] : [key, value]
	);
	return JSON.stringify(Object.fromEntries(entries));
}

function formatBody(body: BodyInit | null | undefined) {
	if (body == null || body === '') return '(empty)';
	if (typeof body !== 'string') return `[${body.constructor.name}]`;
	let text = body;
	try {
		text = JSON.stringify(JSON.parse(body), (key, value) =>
			SECRET_KEY.test(key) ? '[redacted]' : value
		);
	} catch {}
	return text.length > MAX_BODY_LENGTH
		? `${text.slice(0, MAX_BODY_LENGTH)}… (${text.length} chars)`
		: text;
}
