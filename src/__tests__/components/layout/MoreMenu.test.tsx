import { fireEvent, render, screen } from '@testing-library/react';

import { MoreMenu } from '@/components/layout/MoreMenu';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light', setTheme: jest.fn() }) }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
jest.mock('@/features/feedback/ReportProblemDialog', () => ({ ReportProblemDialog: () => null }));

describe('MoreMenu', () => {
	it('shows its label in the sidebar', () => {
		render(<MoreMenu signedIn />);
		const trigger = screen.getByRole('button', { name: 'More' });
		expect(trigger).toHaveTextContent('More');
	});

	it('is an icon button named More in the phone header', () => {
		render(<MoreMenu signedIn placement="header" />);
		const trigger = screen.getByRole('button', { name: 'More' });
		expect(trigger).toHaveTextContent('');
	});

	it('opens Appearance and the account actions from the header', async () => {
		render(<MoreMenu signedIn placement="header" />);
		fireEvent.click(screen.getByRole('button', { name: 'More' }));
		expect(await screen.findByRole('menuitem', { name: 'Settings' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
		expect(screen.getByText('Appearance')).toBeInTheDocument();
	});
});
