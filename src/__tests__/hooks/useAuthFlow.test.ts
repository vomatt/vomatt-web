import { act, renderHook } from '@testing-library/react';

import { useAuthFlow } from '@/components/auth/useAuthFlow';

const mockRequestOtp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('@/lib/api/services/auth', () => ({
	requestOtp: (...args: unknown[]) => mockRequestOtp(...args),
	verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
}));

jest.mock('@/lib/api/services/users', () => ({
	updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

async function atCodeStep(isNewUser: boolean) {
	mockRequestOtp.mockResolvedValue({ status: 'SUCCESS', isNewUser });
	const hook = renderHook(() => useAuthFlow());
	await act(async () => {
		await hook.result.current.submitEmail('User@Test.com');
	});
	return hook;
}

describe('useAuthFlow', () => {
	it('starts at the email step', () => {
		const { result } = renderHook(() => useAuthFlow());
		expect(result.current.step).toBe('email');
	});

	it('moves to the code step once a code is sent', async () => {
		const { result } = await atCodeStep(false);

		expect(mockRequestOtp).toHaveBeenCalledWith('User@Test.com');
		expect(result.current.step).toBe('code');
		expect(result.current.email).toBe('User@Test.com');
	});

	it('stays on the email step when sending fails', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'ERROR', error: 'rateLimited' });
		const { result } = renderHook(() => useAuthFlow());

		let res: unknown;
		await act(async () => {
			res = await result.current.submitEmail('user@test.com');
		});

		expect(res).toEqual({ status: 'ERROR', error: 'rateLimited' });
		expect(result.current.step).toBe('email');
	});

	it('finishes an existing user right after the code', async () => {
		const { result } = await atCodeStep(false);
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS' });

		let res: unknown;
		await act(async () => {
			res = await result.current.submitCode('123456');
		});

		// The server actions normalise the email
		expect(mockVerifyOtp).toHaveBeenCalledWith('User@Test.com', '123456');
		expect(res).toEqual({ status: 'OK', done: true });
	});

	it('asks a new user for a display name after the code', async () => {
		const { result } = await atCodeStep(true);
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS' });

		let res: unknown;
		await act(async () => {
			res = await result.current.submitCode('123456');
		});

		expect(res).toEqual({ status: 'OK' });
		expect(result.current.step).toBe('profile');
	});

	it('returns a wrong code error and stays on the code step', async () => {
		const { result } = await atCodeStep(false);
		mockVerifyOtp.mockResolvedValue({ status: 'ERROR', error: 'invalidCode' });

		let res: unknown;
		await act(async () => {
			res = await result.current.submitCode('000000');
		});

		expect(res).toEqual({ status: 'ERROR', error: 'invalidCode' });
		expect(result.current.step).toBe('code');
	});

	it('resends to the same email', async () => {
		const { result } = await atCodeStep(false);
		await act(async () => {
			await result.current.resendCode();
		});
		expect(mockRequestOtp).toHaveBeenLastCalledWith('User@Test.com');
	});

	it('saves the trimmed display name', async () => {
		const { result } = await atCodeStep(true);
		mockUpdateProfile.mockResolvedValue({});
		await act(async () => {
			await result.current.submitProfile('  Alice ');
		});
		expect(mockUpdateProfile).toHaveBeenCalledWith({ displayName: 'Alice' });
	});

	it('goes back to edit the email', async () => {
		const { result } = await atCodeStep(false);
		act(() => result.current.editEmail());
		expect(result.current.step).toBe('email');
	});
});
