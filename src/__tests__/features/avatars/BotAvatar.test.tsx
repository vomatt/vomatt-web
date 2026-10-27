import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BotAvatar } from '@/features/avatars/BotAvatar';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

describe('BotAvatar', () => {
	it("shows the character's name and trait on hover", async () => {
		const { container } = render(<BotAvatar kind="bear" tooltip />);
		await userEvent.hover(container.querySelector('img')!);
		expect(await screen.findByText('Black Bear')).toBeInTheDocument();
		expect(screen.getByText('A moon on its chest')).toBeInTheDocument();
	});

	it('draws the flat image on a muted circle by default', () => {
		const { container } = render(<BotAvatar kind="bear" />);
		const img = container.querySelector('img')!;
		expect(img).toHaveAttribute('src', '/avatars/bear.svg');
		expect(img).toHaveClass('avatar-frame', 'bg-muted');
		expect(img).not.toHaveClass('bg-avatar-stone');
		expect(container.querySelector('[data-slot="tooltip-trigger"]')).toBeNull();
	});

	it('draws the Round 2 image on its tinted circle when asked', () => {
		const { container } = render(<BotAvatar kind="bear" variant="round2" />);
		const img = container.querySelector('img')!;
		expect(img).toHaveAttribute('src', '/avatars/round2/bear.svg');
		expect(img).toHaveClass('avatar-frame', 'bg-avatar-stone');
	});
});
