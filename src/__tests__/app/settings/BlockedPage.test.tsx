import { render, screen } from '@testing-library/react';

import BlockedPage from '@/app/(frontend)/settings/blocked/page';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/lib/getServerLocale', () => ({ getServerMessages: jest.fn() }));
jest.mock('@/features/blocks/BlockedUsersPanel', () => ({ BlockedUsersPanel: () => <p>Blocked panel</p> }));

describe('Blocked people page', () => {
	it('is titled Blocked people and leads back to Settings', () => {
		render(<BlockedPage />);
		expect(screen.getByRole('heading', { level: 1, name: 'Blocked people' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to Settings' })).toHaveAttribute('href', '/settings');
		expect(screen.getByText('Blocked panel')).toBeInTheDocument();
	});
});
