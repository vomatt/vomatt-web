import { render, screen } from '@testing-library/react';

import AuthContainer from '@/components/auth/AuthContainer';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

jest.mock('@/contexts/LanguageContext', () => ({
	useLanguage: () => ({ t: (key: string) => key }),
}));

const RULE_KEYS = ['brandRuleSealed', 'brandRuleOneVote', 'brandRuleResults'] as const;

describe('AuthContainer', () => {
	it('lists the voting rules in the brand panel', () => {
		render(<AuthContainer>form</AuthContainer>);
		const items = screen.getAllByRole('listitem').map((item) => item.textContent);
		expect(items).toEqual(RULE_KEYS.map((key) => `login.${key}`));
	});

	it.each([
		['en', en],
		['zh', zh],
	])('has every rule string in %s', (_, locale) => {
		for (const key of RULE_KEYS) {
			expect(locale.login[key]).toEqual(expect.any(String));
		}
	});

	it('renders the form visible, without waiting for an animation', () => {
		render(<AuthContainer>form</AuthContainer>);
		expect(screen.getByText('form')).not.toHaveStyle({ opacity: '0' });
	});
});
