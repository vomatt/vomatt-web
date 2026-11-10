import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PhoneBindDialog } from '@/features/account/PhoneBindDialog';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockSend = jest.fn();
const mockVerify = jest.fn();
jest.mock('@/lib/api/services/users', () => ({
	sendPhoneBindOtp: (...a: unknown[]) => mockSend(...a),
	verifyPhoneBind: (...a: unknown[]) => mockVerify(...a),
}));
const mockSignout = jest.fn();
jest.mock('@/lib/api/services/auth', () => ({ signout: () => mockSignout() }));

if (!document.elementFromPoint) document.elementFromPoint = () => null;

const onVerified = jest.fn();
const onOpenChange = jest.fn();

beforeEach(() => {
	jest.clearAllMocks();
	mockSend.mockResolvedValue({ ok: true, data: undefined });
});

function openDialog(defaultPhone: string | null = null) {
	render(<PhoneBindDialog open onOpenChange={onOpenChange} onVerified={onVerified} defaultPhone={defaultPhone} />);
}

async function sendTo(phone: string) {
	fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: phone } });
	fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
	await screen.findByLabelText('6-digit verification code');
}

const enterCode = (value: string) =>
	act(async () => {
		fireEvent.change(screen.getByLabelText('6-digit verification code'), { target: { value } });
	});

describe('PhoneBindDialog', () => {
	it('texts a code to the number, then binds it with the code', async () => {
		const profile = { phoneNumber: '+886912345678', phoneVerified: true };
		mockVerify.mockResolvedValue({ ok: true, data: profile });
		openDialog();
		await sendTo(' 0912345678 ');
		expect(mockSend).toHaveBeenCalledWith('0912345678');
		expect(screen.getByText('0912345678')).toBeInTheDocument();

		await enterCode('123456');
		await waitFor(() => expect(onVerified).toHaveBeenCalled());
		expect(mockVerify).toHaveBeenCalledWith('0912345678', '123456');
	});

	it('marks a wrong code on the form and never signs out', async () => {
		mockVerify.mockResolvedValue({ ok: false, status: 401, errorCode: 'auth.invalid_otp', message: 'Your session has expired.' });
		openDialog();
		await sendTo('0912345678');
		await enterCode('000000');

		expect(await screen.findByText('That code is not right. Check the text message and try again.')).toBeInTheDocument();
		expect(screen.getByLabelText('6-digit verification code')).toBeInTheDocument();
		expect(mockSignout).not.toHaveBeenCalled();
		expect(onVerified).not.toHaveBeenCalled();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('says when the number belongs to another account', async () => {
		mockVerify.mockResolvedValue({ ok: false, status: 409, errorCode: 'user.phone.taken', message: 'Phone number already in use' });
		openDialog();
		await sendTo('0912345678');
		await enterCode('123456');
		expect(await screen.findByText('This number is linked to another account.')).toBeInTheDocument();
		expect(onVerified).not.toHaveBeenCalled();
	});

	it('shows the lockout after too many wrong codes', async () => {
		mockVerify.mockResolvedValue({ ok: false, status: 401, errorCode: 'auth.otp.too_many_attempts', message: '' });
		openDialog();
		await sendTo('0912345678');
		await enterCode('000000');
		expect(await screen.findByText('Too many wrong attempts. Wait a few minutes, then try again.')).toBeInTheDocument();
	});

	it('opens the code step on a cooldown, counting down from the seconds left', async () => {
		mockSend.mockResolvedValue({ ok: false, status: 400, errorCode: 'auth.otp.resend_cooldown', message: 'Please wait 95 seconds before resending' });
		openDialog();
		await sendTo('0912345678');
		expect(screen.getByText('Resend code in 1:35')).toBeInTheDocument();
	});

	it('keeps the number step with the daily limit copy', async () => {
		mockSend.mockResolvedValue({ ok: false, status: 429, errorCode: 'auth.otp.daily_limit', message: '' });
		openDialog();
		fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '0912345678' } });
		fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
		expect(await screen.findByText('Too many codes requested today, please try again tomorrow')).toBeInTheDocument();
		expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
	});

	it('prefills a number that still needs verifying, and can go back to change it', async () => {
		openDialog('+886912345678');
		expect(screen.getByLabelText('Phone number')).toHaveValue('+886912345678');
		await sendTo('+886912345678');
		fireEvent.click(screen.getByRole('button', { name: 'Use a different number' }));
		expect(screen.getByLabelText('Phone number')).toHaveValue('+886912345678');
	});
});
