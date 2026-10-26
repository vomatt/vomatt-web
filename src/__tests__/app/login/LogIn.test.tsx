import { render, screen } from '@testing-library/react';

import { LogIn } from '@/app/(frontend)/login/_component/LogIn';

let mockSearch = '';

jest.mock('next/navigation', () => ({
	useRouter: () => ({ replace: jest.fn() }),
	useSearchParams: () => new URLSearchParams(mockSearch),
}));

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

jest.mock('@/lib/api/services/auth', () => ({ requestOtp: jest.fn(), verifyOtp: jest.fn() }));
jest.mock('@/lib/api/services/users', () => ({ updateProfile: jest.fn() }));

// @portabletext/react ships ESM only, which Jest doesn't load
jest.mock('@/components/CustomPortableText', () => ({
	__esModule: true,
	default: ({ blocks }: { blocks: { children: { text: string }[] }[] }) =>
		blocks.map((block) => block.children.map((child) => child.text).join('')).join(' '),
}));

describe('LogIn', () => {
	it('explains an expired session before the title, where reading starts', () => {
		mockSearch = 'session_expired=1';
		render(<LogIn />);
		const notice = screen.getByText('Your session expired. Please log in again.');
		const title = screen.getByRole('heading', { level: 1, name: 'Log in or sign up' });
		expect(notice.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('shows no notice on a plain visit', () => {
		mockSearch = '';
		render(<LogIn />);
		expect(screen.queryByText(/session expired/)).not.toBeInTheDocument();
	});

	it('shows the sign-up terms under the email step', () => {
		mockSearch = '';
		render(
			<LogIn
				policyMessage={[
					{ _type: 'block', _key: 'a', children: [{ _type: 'span', _key: 'b', text: 'By continuing you agree to the terms.' }] },
				]}
			/>
		);
		expect(screen.getByText('By continuing you agree to the terms.')).toBeInTheDocument();
	});
});
