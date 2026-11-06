import { existsSync } from 'fs';
import path from 'path';

import {
	BOT_FAMILIES,
	BOT_KINDS,
	BOT_TINTS,
	botAvatarUrl,
	defaultBotFor,
	parseBotAvatar,
	resolveAvatar,
} from '@/features/avatars/catalog';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

describe('the cast', () => {
	it('has 60 characters, none twice', () => {
		expect(BOT_KINDS).toHaveLength(60);
		expect(new Set(BOT_KINDS).size).toBe(60);
	});

	// The picker shows six across on phones and ten on desktop
	it('fills every row of the picker', () => {
		expect(BOT_KINDS.length % 6).toBe(0);
		expect(BOT_KINDS.length % 10).toBe(0);
	});

	it('gives every character a drawing, a tint and copy in both languages', () => {
		BOT_KINDS.forEach((kind) => {
			expect(existsSync(path.join(process.cwd(), 'public/avatars', `${kind}.svg`))).toBe(true);
			expect(BOT_TINTS[kind]).toBeTruthy();
			expect(en.avatar.bots[kind].name).toBeTruthy();
			expect(zh.avatar.bots[kind].trait).toBeTruthy();
		});
	});

	it('has a Round 2 drawing for every character of the first four families', () => {
		[...BOT_FAMILIES.bites, ...BOT_FAMILIES.guardians, ...BOT_FAMILIES.visitors, ...BOT_FAMILIES.animals].forEach(
			(kind) => expect(existsSync(path.join(process.cwd(), 'public/avatars/round2', `${kind}.svg`))).toBe(true)
		);
	});

	it('has copy in both languages for no character', () => {
		expect(en.avatar.none.name).toBeTruthy();
		expect(zh.avatar.none.trait).toBeTruthy();
		expect(en.avatar.remove).toBeTruthy();
		expect(zh.avatar.remove).toBeTruthy();
	});
});

describe('parseBotAvatar()', () => {
	it('reads the kind back from a stored value', () => {
		expect(parseBotAvatar(botAvatarUrl('mazu'))).toBe('mazu');
	});

	it.each([null, undefined, '', 'bot:', 'bot:unicorn', 'bot:none', 'https://example.com/a.png'])(
		'returns null for %p',
		(value) => expect(parseBotAvatar(value)).toBeNull()
	);
});

describe('defaultBotFor()', () => {
	it('picks the same bot for a username every time, ignoring case', () => {
		expect(defaultBotFor('Mei_Lin')).toBe(defaultBotFor('mei_lin'));
	});

	it.each([
		['user0', 'moth'],
		['user1', 'dachshund'],
		['user2', 'cyclops'],
		['user3', 'frenchie'],
	])('keeps the character %s had before the cast shrank (%s)', (username, kind) => {
		expect(defaultBotFor(username)).toBe(kind);
	});

	it('gives a username whose character retired one from the cast', () => {
		expect(BOT_KINDS).toContain(defaultBotFor('user12'));
		expect(BOT_KINDS).toContain(defaultBotFor('user26'));
	});

	it('spreads usernames across the cast', () => {
		const picked = new Set(Array.from({ length: 200 }, (_, i) => defaultBotFor(`user${i}`)));
		expect(picked.size).toBeGreaterThan(30);
	});
});

describe('resolveAvatar()', () => {
	it('uses a chosen bot', () => {
		expect(resolveAvatar('mei', 'bot:dog')).toBe('dog');
	});

	it('uses the account icon when no character was chosen', () => {
		expect(resolveAvatar('mei', 'bot:none')).toBe('none');
	});

	it.each(['bot:egg', 'bot:unicorn'])('uses the account icon when the chosen bot is no longer in the cast (%p)', (value) =>
		expect(resolveAvatar('mei', value)).toBe('none')
	);

	it.each([null, undefined, 'https://lh3.example.com/p.jpg', 'http://old.example.com/p.jpg'])(
		'falls back to the username bot for %p',
		(value) => expect(resolveAvatar('mei', value)).toBe(defaultBotFor('mei'))
	);
});
