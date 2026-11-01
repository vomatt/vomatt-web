import { render, screen } from '@testing-library/react';

import DevicesPage from '@/app/(frontend)/settings/devices/page';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/lib/getServerLocale', () => ({ getServerMessages: jest.fn() }));
jest.mock('@/features/sessions/SessionsPanel', () => ({ SessionsPanel: () => <p>Sessions panel</p> }));

describe('Signed-in devices page', () => {
	it('is titled Signed-in devices and leads back to Settings', () => {
		render(<DevicesPage />);
		expect(screen.getByRole('heading', { level: 1, name: 'Signed-in devices' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to Settings' })).toHaveAttribute('href', '/settings');
		expect(screen.getByText('Sessions panel')).toBeInTheDocument();
	});
});
