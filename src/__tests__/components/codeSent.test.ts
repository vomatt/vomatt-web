import { forgetCodeSent, recallCodeSent, rememberCodeSent } from '@/components/auth/codeSent';

const start = 1_800_000_000_000;
let now: jest.SpyInstance<number, []>;

beforeEach(() => {
	sessionStorage.clear();
	now = jest.spyOn(Date, 'now').mockReturnValue(start);
});

afterEach(() => now.mockRestore());

describe('remembered sign-in code', () => {
	it('gives back the address with the full cooldown for a code just sent', () => {
		rememberCodeSent('a@b.co');
		expect(recallCodeSent()).toEqual({ email: 'a@b.co', resendIn: 180 });
	});

	it('counts the cooldown down as time passes', () => {
		rememberCodeSent('a@b.co');
		now.mockReturnValue(start + 61_000);
		expect(recallCodeSent()?.resendIn).toBe(119);
	});

	it('dates an earlier code from the cooldown the API reports, rather than from now', () => {
		rememberCodeSent('a@b.co', 40);
		expect(recallCodeSent()?.resendIn).toBe(40);
		now.mockReturnValue(start + 10_000);
		expect(recallCodeSent()?.resendIn).toBe(30);
	});

	it('allows a resend at once once the cooldown has passed, never a negative wait', () => {
		rememberCodeSent('a@b.co');
		now.mockReturnValue(start + 5 * 60_000);
		expect(recallCodeSent()).toEqual({ email: 'a@b.co', resendIn: 0 });
	});

	it('forgets the address after 15 minutes', () => {
		rememberCodeSent('a@b.co');
		now.mockReturnValue(start + 15 * 60_000 + 1);
		expect(recallCodeSent()).toBeNull();
	});

	it('forgets the address when asked', () => {
		rememberCodeSent('a@b.co');
		forgetCodeSent();
		expect(recallCodeSent()).toBeNull();
	});

	it('reads nothing from a malformed entry', () => {
		sessionStorage.setItem('vomatt_sign_in_code', '{nope');
		expect(recallCodeSent()).toBeNull();
	});
});
