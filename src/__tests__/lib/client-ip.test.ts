import { clientIpHeaders } from '@/lib/api/client-ip';

const SECRET = 'client-ip-secret-0123456789abcdef';

afterEach(() => {
	delete process.env.CLIENT_IP_SECRET;
});

it('sends the first x-forwarded-for entry with the secret', () => {
	process.env.CLIENT_IP_SECRET = SECRET;
	expect(clientIpHeaders(new Headers({ 'x-forwarded-for': ' 198.51.100.9 , 10.0.0.1' }))).toEqual({
		'X-Client-IP': '198.51.100.9',
		'X-Client-IP-Secret': SECRET,
	});
});

it('falls back to x-real-ip', () => {
	process.env.CLIENT_IP_SECRET = SECRET;
	expect(clientIpHeaders(new Headers({ 'x-real-ip': '2001:db8::1' }))).toMatchObject({ 'X-Client-IP': '2001:db8::1' });
});

it('sends nothing without the secret or an IP', () => {
	expect(clientIpHeaders(new Headers({ 'x-forwarded-for': '198.51.100.9' }))).toEqual({});
	process.env.CLIENT_IP_SECRET = SECRET;
	expect(clientIpHeaders(new Headers())).toEqual({});
});
