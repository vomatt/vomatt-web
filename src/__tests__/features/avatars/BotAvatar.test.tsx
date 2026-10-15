import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BotAvatar } from '@/features/avatars/BotAvatar';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

describe('BotAvatar', () => {
	it("shows the character's name and trait on hover", async () => {
		const { container } = render(<BotAvatar kind="bear" />);
		await userEvent.hover(container.querySelector('img')!);
		expect(await screen.findByText('Black Bear')).toBeInTheDocument();
		expect(screen.getByText('A moon on its chest')).toBeInTheDocument();
	});

	it('draws the image alone when the tooltip is off', () => {
		const { container } = render(<BotAvatar kind="bear" tooltip={false} />);
		expect(container.querySelector('img')).toHaveAttribute('src', '/avatars/bear.svg');
		expect(container.querySelector('[data-slot="tooltip-trigger"]')).toBeNull();
	});
});
