import { fireEvent, render } from '@testing-library/react';

import { UserAvatar } from '@/features/avatars/UserAvatar';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

describe('UserAvatar', () => {
	it('draws the account icon on a muted circle when no character was chosen', () => {
		const { container } = render(<UserAvatar username="mei" avatarUrl="bot:none" />);
		expect(container.querySelector('img')).toBeNull();
		expect(container.firstElementChild).toHaveClass('avatar-frame', 'bg-muted');
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

	it('draws an uploaded photo from the API path', () => {
		const { container } = render(<UserAvatar username="mei" avatarUrl="/api/avatars/abc-123.jpg" />);
		expect(container.querySelector('img')).toHaveAttribute('src', '/api/avatars/abc-123.jpg');
	});

	it('falls back to the bot the username picks when the uploaded photo fails to load', () => {
		const { container } = render(<UserAvatar username="mei" avatarUrl="/api/avatars/deleted-1.jpg" />);
		fireEvent.error(container.querySelector('img')!);
		expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^\/avatars\//);
	});

	it('falls back when the photo had already failed before the page was interactive', () => {
		const complete = jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
		try {
			const { container } = render(<UserAvatar username="mei" avatarUrl="/api/avatars/deleted-1.jpg" />);
			expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^\/avatars\//);
		} finally {
			complete.mockRestore();
		}
	});

	it('ignores an image URL that is not an uploaded avatar path', () => {
		const { container } = render(<UserAvatar username="mei" avatarUrl="https://example.com/me.png" />);
		expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^\/avatars\//);
	});
});
