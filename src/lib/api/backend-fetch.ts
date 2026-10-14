const MAX_BODY_LENGTH = 4000;
// `code` is the sign-in OTP; exact match so fields like `errorCode` still show
const SECRET_KEY = /token|password|secret|^code$/i;
const INDENT = '      ';

/**
 * `fetch` for vomatt-api calls made on the server. It logs each request and
 * response: on by default in `next dev` (API_LOG=0 silences it), off in
 * deployments unless API_LOG=1, e.g. on the `dev` branch's preview, where the
 * log shows up in Vercel's Runtime Logs.
 */
export async function backendFetch(
	url: string,
	init: RequestInit = {}
): Promise<Response> {
	if (!isLogEnabled()) return fetch(url, init);

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
					[
						`${paint('[api]', 'dim')} ${paint(label, 'bold')} → ${paint(String(response.status), statusColor(response.status))} ${paint(`(${ms}ms)`, 'dim')}`,
						section('request headers', formatHeaders(init.headers)),
						section('request body', formatBody(init.body)),
						section('response body', formatBody(responseBody)),
					].join('\n')
				);
			});
		return response;
	} catch (error) {
		// Only the message: callers log or rethrow the error with its stack
		const ms = Math.round(performance.now() - start);
		const reason = error instanceof Error ? error.message : String(error);
		console.log(
			`${paint('[api]', 'dim')} ${paint(label, 'bold')} → ${paint('failed', 'red')} ${paint(`(${ms}ms)`, 'dim')}: ${reason}`
		);
		throw error;
	}
}

function isLogEnabled() {
	if (process.env.API_LOG === '0') return false;
	return process.env.NODE_ENV === 'development' || process.env.API_LOG === '1';
}

const COLORS = { bold: 1, dim: 2, red: 31, green: 32, yellow: 33, cyan: 36 };

// Vercel's log viewer shows escape codes as text, so color only the local terminal
function paint(text: string, color: keyof typeof COLORS) {
	if (process.env.VERCEL) return text;
	return `\x1b[${COLORS[color]}m${text}\x1b[0m`;
}

function statusColor(status: number): keyof typeof COLORS {
	if (status >= 500) return 'red';
	if (status >= 400) return 'yellow';
	return 'green';
}

function section(title: string, content: string) {
	const body = content.replace(/^/gm, INDENT);
	return `  ${paint(`▸ ${title}`, 'cyan')}\n${body}`;
}

function formatHeaders(headers: HeadersInit | undefined) {
	const lines = [...new Headers(headers).entries()].map(
		([key, value]) => `${key}: ${key === 'authorization' ? '[redacted]' : value}`
	);
	return lines.length ? lines.join('\n') : '(none)';
}

function formatBody(body: BodyInit | null | undefined) {
	if (body == null || body === '') return '(empty)';
	if (typeof body !== 'string') return `[${body.constructor.name}]`;
	let text = body;
	try {
		text = JSON.stringify(
			JSON.parse(body),
			(key, value) => (SECRET_KEY.test(key) ? '[redacted]' : value),
			2
		);
	} catch {}
	return text.length > MAX_BODY_LENGTH
		? `${text.slice(0, MAX_BODY_LENGTH)}… (${text.length} chars)`
		: text;
}
