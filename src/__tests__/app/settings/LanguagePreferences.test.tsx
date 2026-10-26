import { fireEvent, render, screen } from '@testing-library/react';

import { LanguagePreferences } from '@/app/(frontend)/settings/language/_components/LanguagePreferences';

const mockSetLanguage = jest.fn();
jest.mock('@/contexts/LanguageContext', () => {
	const { useLanguage } = jest.requireActual('../../helpers/mockLanguage');
	return { useLanguage: () => ({ ...useLanguage(), setLanguage: mockSetLanguage }) };
});
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

describe('LanguagePreferences', () => {
	it('leads back to Settings', () => {
		render(<LanguagePreferences />);
		expect(screen.getByRole('link', { name: 'Back to Settings' })).toHaveAttribute('href', '/settings');
		expect(screen.getByRole('heading', { level: 1, name: 'Language preferences' })).toBeInTheDocument();
	});

	it('offers each language as one choice, the current one checked', () => {
		render(<LanguagePreferences />);
		expect(screen.getByRole('radiogroup', { name: 'App language' })).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
		expect(screen.getByRole('radio', { name: '繁體中文' })).not.toBeChecked();
	});

	it('switches the language and re-renders the server parts', () => {
		render(<LanguagePreferences />);
		fireEvent.click(screen.getByRole('radio', { name: '繁體中文' }));
		expect(mockSetLanguage).toHaveBeenCalledWith('zh');
		expect(mockRefresh).toHaveBeenCalled();
	});
});
