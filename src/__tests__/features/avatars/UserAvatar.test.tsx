import { render } from '@testing-library/react';

import { UserAvatar } from '@/features/avatars/UserAvatar';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

describe('UserAvatar', () => {
	it('draws the account icon on a muted circle when no character was chosen', () => {
		const { container } = render(<UserAvatar username="mei" avatarUrl="bot:none" />);
		expect(container.querySelector('img')).toBeNull();
		expect(container.firstElementChild).toHaveClass('rounded-full', 'bg-muted');
		expect(container.querySelector('svg')).toBeInTheDocument();
	});

	it('shows no hover card for the account icon', () => {
		const { container } = render(<UserAvatar username="mei" avatarUrl="bot:none" tooltip />);
		expect(container.querySelector('[data-slot="tooltip-trigger"]')).toBeNull();
	});

	it('draws the chosen bot', () => {
		const { container } = render(<UserAvatar username="mei" avatarUrl="bot:dog" />);
		expect(container.querySelector('img')).toHaveAttribute('src', '/avatars/dog.svg');
	});
});
