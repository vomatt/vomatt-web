import { settle } from '@/lib/api/settle';

it('passes an action result through', async () => {
	expect(await settle(Promise.resolve({ ok: true as const, data: 1 }))).toEqual({ ok: true, data: 1 });
});

it('turns a rejected call into the generic failure', async () => {
	expect(await settle(Promise.reject(new TypeError('Failed to fetch')))).toEqual({
		ok: false,
		message: 'Request failed',
	});
});
