import { renderHook, act } from '@testing-library/react';
import { useAuthFlow } from '@/components/auth/useAuthFlow';

const mockGetVerifyCode = jest.fn();
const mockLogin = jest.fn();
const mockPreSignup = jest.fn();
const mockSignup = jest.fn();

jest.mock('@/lib/api/services/auth', () => ({
	getVerifyCode: (...args: any[]) => mockGetVerifyCode(...args),
	login: (...args: any[]) => mockLogin(...args),
	preSignup: (...args: any[]) => mockPreSignup(...args),
	signup: (...args: any[]) => mockSignup(...args),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

describe('useAuthFlow', () => {
	it('starts in login mode at form step', () => {
		const { result } = renderHook(() => useAuthFlow());

		expect(result.current.mode).toBe('login');
		expect(result.current.step).toBe('form');
		expect(result.current.email).toBe('');
	});

	it('submitLoginEmail transitions to verification on success', async () => {
		mockGetVerifyCode.mockResolvedValue({ status: 'SUCCESS' });

		const { result } = renderHook(() => useAuthFlow());

		let res: any;
		await act(async () => {
			res = await result.current.submitLoginEmail('user@test.com');
		});

		expect(mockGetVerifyCode).toHaveBeenCalledWith('user@test.com');
		expect(result.current.step).toBe('verification');
		expect(result.current.email).toBe('user@test.com');
		expect(res.status).toBe('SUCCESS');
	});

	it('submitLoginEmail returns USER_NOT_FOUND without transitioning', async () => {
		mockGetVerifyCode.mockResolvedValue({
			status: 'ERROR',
			errorType: 'USER_NOT_FOUND',
		});

		const { result } = renderHook(() => useAuthFlow());

		let res: any;
		await act(async () => {
			res = await result.current.submitLoginEmail('new@test.com');
		});

		expect(res.status).toBe('ERROR');
		expect(res.errorType).toBe('USER_NOT_FOUND');
		expect(result.current.step).toBe('form');
	});

	it('submitLoginEmail returns other errors without transitioning', async () => {
		mockGetVerifyCode.mockResolvedValue({
			status: 'ERROR',
			errorType: 'RATE_LIMIT',
		});

		const { result } = renderHook(() => useAuthFlow());

		let res: any;
		await act(async () => {
			res = await result.current.submitLoginEmail('user@test.com');
		});

		expect(res.status).toBe('ERROR');
		expect(res.errorType).toBe('RATE_LIMIT');
		expect(result.current.step).toBe('form');
	});

	it('handleLoginVerified calls login and returns result', async () => {
		mockGetVerifyCode.mockResolvedValue({ status: 'SUCCESS' });
		mockLogin.mockResolvedValue({ status: 'SUCCESS' });

		const { result } = renderHook(() => useAuthFlow());

		await act(async () => {
			await result.current.submitLoginEmail('user@test.com');
		});

		let res: any;
		await act(async () => {
			res = await result.current.handleLoginVerified('123456');
		});

		expect(mockLogin).toHaveBeenCalledWith('user@test.com', '123456');
		expect(res.status).toBe('OK');
	});

	it('handleLoginVerified returns error on failure', async () => {
		mockGetVerifyCode.mockResolvedValue({ status: 'SUCCESS' });
		mockLogin.mockResolvedValue({ status: 'ERROR', message: 'Invalid code' });

		const { result } = renderHook(() => useAuthFlow());

		await act(async () => {
			await result.current.submitLoginEmail('user@test.com');
		});

		let res: any;
		await act(async () => {
			res = await result.current.handleLoginVerified('000000');
		});

		expect(res.status).toBe('ERROR');
	});

	it('submitSignupForm transitions to verification on success', async () => {
		mockPreSignup.mockResolvedValue({ status: 'SUCCESS' });

		const { result } = renderHook(() => useAuthFlow());

		act(() => {
			result.current.switchToSignup();
		});

		const formData = {
			email: 'new@test.com',
			firstName: 'John',
			lastName: 'Doe',
			username: 'johndoe',
		};

		let res: any;
		await act(async () => {
			res = await result.current.submitSignupForm(formData);
		});

		expect(mockPreSignup).toHaveBeenCalledWith('new@test.com', 'johndoe');
		expect(result.current.step).toBe('verification');
		expect(result.current.email).toBe('new@test.com');
		expect(res.status).toBe('SUCCESS');
	});

	it('handleSignupVerified calls signup and returns result', async () => {
		mockPreSignup.mockResolvedValue({ status: 'SUCCESS' });
		mockSignup.mockResolvedValue({ status: 'SUCCESS' });

		const { result } = renderHook(() => useAuthFlow());

		const formData = {
			email: 'new@test.com',
			firstName: 'John',
			lastName: 'Doe',
			username: 'johndoe',
		};

		await act(async () => {
			await result.current.submitSignupForm(formData);
		});

		let res: any;
		await act(async () => {
			res = await result.current.handleSignupVerified('654321');
		});

		expect(mockSignup).toHaveBeenCalledWith({
			...formData,
			verificationCode: '654321',
		});
		expect(res.status).toBe('OK');
	});

	it('switchToSignup and switchToLogin change mode', () => {
		const { result } = renderHook(() => useAuthFlow());

		act(() => {
			result.current.switchToSignup();
		});
		expect(result.current.mode).toBe('signup');
		expect(result.current.step).toBe('form');

		act(() => {
			result.current.switchToLogin();
		});
		expect(result.current.mode).toBe('login');
		expect(result.current.step).toBe('form');
	});

	it('goBackToForm returns to form step', async () => {
		mockGetVerifyCode.mockResolvedValue({ status: 'SUCCESS' });

		const { result } = renderHook(() => useAuthFlow());

		await act(async () => {
			await result.current.submitLoginEmail('user@test.com');
		});
		expect(result.current.step).toBe('verification');

		act(() => {
			result.current.goBackToForm();
		});
		expect(result.current.step).toBe('form');
	});

	it('reset clears all state', async () => {
		mockGetVerifyCode.mockResolvedValue({ status: 'SUCCESS' });

		const { result } = renderHook(() => useAuthFlow());

		await act(async () => {
			await result.current.submitLoginEmail('user@test.com');
		});

		act(() => {
			result.current.reset();
		});

		expect(result.current.mode).toBe('login');
		expect(result.current.step).toBe('form');
		expect(result.current.email).toBe('');
	});
});
