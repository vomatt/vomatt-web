import { clientHeaders } from '@/lib/api/client-ip';

const SECRET = 'client-ip-secret-0123456789abcdef';

afterEach(() => {
	delete process.env.CLIENT_IP_SECRET;
});

it('sends the first x-forwarded-for entry with the secret', () => {
	process.env.CLIENT_IP_SECRET = SECRET;
	expect(clientHeaders(new Headers({ 'x-forwarded-for': ' 198.51.100.9 , 10.0.0.1' }))).toEqual({
		'X-Client-IP': '198.51.100.9',
		'X-Client-IP-Secret': SECRET,
	});
});

it('falls back to x-real-ip', () => {
	process.env.CLIENT_IP_SECRET = SECRET;
	expect(clientHeaders(new Headers({ 'x-real-ip': '2001:db8::1' }))).toMatchObject({ 'X-Client-IP': '2001:db8::1' });
});

it('sends nothing without the secret or an IP', () => {
	expect(clientHeaders(new Headers({ 'x-forwarded-for': '198.51.100.9' }))).toEqual({});
	process.env.CLIENT_IP_SECRET = SECRET;
	expect(clientHeaders(new Headers())).toEqual({});
});

it("forwards the browser's User-Agent, with or without the secret", () => {
	const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1';
	expect(clientHeaders(new Headers({ 'user-agent': ua }))).toEqual({ 'User-Agent': ua });
});
