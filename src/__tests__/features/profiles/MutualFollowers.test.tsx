import { fireEvent, render, screen } from '@testing-library/react';

import { MutualFollowersLine } from '@/features/profiles/MutualFollowers';
import type { UserDto } from '@/schemas/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const jtan = { id: 'u3', username: 'jtan', displayName: 'Jun Tan', avatarUrl: 'bot:boba' };
const rosa = { id: 'u4', username: 'rosa', displayName: null, avatarUrl: null };
const ken = { id: 'u5', username: 'ken', displayName: 'Ken', avatarUrl: null };

const line = (mutualFollowersCount: number | null, mutualFollowersPreview: UserDto[] | null) =>
	render(<MutualFollowersLine profile={{ mutualFollowersCount, mutualFollowersPreview }} />).container;

it.each([
	[1, [jtan], 'Followed by @jtan'],
	[2, [jtan, rosa], 'Followed by @jtan and @rosa'],
	[3, [jtan, rosa, ken], 'Followed by @jtan and 2 others you follow'],
	[1205, [jtan, rosa, ken], 'Followed by @jtan and 1,204 others you follow'],
	// A preview short of the count still names only who it holds
	[2, [jtan], 'Followed by @jtan and 1 other you follow'],
])('with %i people in common it says "%s"', (count, preview, text) => {
	expect(line(count, preview)).toHaveTextContent(new RegExp(`^${text}$`));
});

it('stacks one small avatar per person it names, two at most', () => {
	expect(line(1, [jtan]).querySelectorAll('img')).toHaveLength(1);
	const avatars = line(3, [jtan, rosa, ken]).querySelectorAll('img');
	expect(avatars).toHaveLength(2);
	expect(avatars[0]).toHaveClass('size-4');
	expect(avatars[1]).toHaveClass('size-4', '-ml-2.5');
});

it.each([
	['signed out or on their own profile', null, null],
	['no one in common', 0, []],
])('shows nothing %s', (_, count, preview) => {
	expect(line(count, preview)).toBeEmptyDOMElement();
});

it('is plain text without onOpen, and a button that opens the list with it', () => {
	const profile = { mutualFollowersCount: 2, mutualFollowersPreview: [jtan, rosa] };
	const { rerender } = render(<MutualFollowersLine profile={profile} />);
	expect(screen.queryByRole('button')).not.toBeInTheDocument();

	const onOpen = jest.fn();
	rerender(<MutualFollowersLine profile={profile} onOpen={onOpen} />);
	fireEvent.click(screen.getByRole('button', { name: 'Followed by @jtan and @rosa' }));
	expect(onOpen).toHaveBeenCalled();
});
