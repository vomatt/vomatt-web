/** The cast: 72 characters in six families of twelve, in display order. */
export const BOT_FAMILIES = {
	bites: ['boba', 'bao', 'oolong', 'su', 'egg', 'ice', 'youtiao', 'tofu', 'sausage', 'chip', 'tower', 'lumen'],
	guardians: ['mazu', 'tudi', 'yuelao', 'qiye', 'baye', 'shi', 'long', 'denglong', 'ding', 'jiaobei', 'xiang', 'banyan'],
	visitors: ['gray', 'nordic', 'reptile', 'mantis', 'anu', 'tallwhite', 'moth', 'blob', 'cyclops', 'probe', 'saucer', 'trio'],
	animals: ['bear', 'magpie', 'pangolin', 'shihu', 'macaque', 'deer', 'pheasant', 'firefly', 'crab', 'flyfish', 'turtle', 'dog'],
	cats: ['fold', 'munchkin', 'chinchilla', 'mainecoon', 'siamese', 'orange', 'tuxedo', 'calico', 'sphynx', 'ragdoll', 'british', 'bengal'],
	dogs: ['shiba', 'corgi', 'golden', 'husky', 'pug', 'dachshund', 'poodle', 'frenchie', 'beagle', 'collie', 'dalmatian', 'labrador'],
} as const;

export type BotFamily = keyof typeof BOT_FAMILIES;
export type BotKind = (typeof BOT_FAMILIES)[BotFamily][number];

export const BOT_KINDS: readonly BotKind[] = Object.values(BOT_FAMILIES).flat();

type BotTint = 'sand' | 'stone' | 'green' | 'sky' | 'peach' | 'lavender';

/** The circle behind each character; `bg-avatar-<tint>` in global.css. */
export const BOT_TINTS: Record<BotKind, BotTint> = {
	boba: 'sand', bao: 'stone', oolong: 'green', su: 'sand', egg: 'peach', ice: 'sky',
	youtiao: 'sand', tofu: 'stone', sausage: 'peach', chip: 'sky', tower: 'sky', lumen: 'peach',
	mazu: 'sky', tudi: 'sand', yuelao: 'lavender', qiye: 'stone', baye: 'peach', shi: 'stone',
	long: 'peach', denglong: 'peach', ding: 'sand', jiaobei: 'peach', xiang: 'sand', banyan: 'green',
	gray: 'stone', nordic: 'sky', reptile: 'green', mantis: 'peach', anu: 'sand', tallwhite: 'lavender',
	moth: 'lavender', blob: 'green', cyclops: 'sky', probe: 'stone', saucer: 'sky', trio: 'green',
	bear: 'stone', magpie: 'sky', pangolin: 'sand', shihu: 'peach', macaque: 'lavender', deer: 'green',
	pheasant: 'sand', firefly: 'green', crab: 'peach', flyfish: 'sky', turtle: 'sky', dog: 'sand',
	fold: 'stone', munchkin: 'peach', chinchilla: 'lavender', mainecoon: 'stone', siamese: 'sky', orange: 'sand',
	tuxedo: 'stone', calico: 'peach', sphynx: 'peach', ragdoll: 'sky', british: 'stone', bengal: 'sand',
	shiba: 'sand', corgi: 'sand', golden: 'sand', husky: 'sky', pug: 'sand', dachshund: 'sand',
	poodle: 'peach', frenchie: 'stone', beagle: 'peach', collie: 'stone', dalmatian: 'stone', labrador: 'sand',
};

/** No character: the user chose the plain account icon, stored as `bot:none`. Never a default. */
export const NO_BOT = 'none';

/** What a user can choose: one of the cast, or no character. */
export type AvatarChoice = BotKind | typeof NO_BOT;

/** A chosen bot is stored in the user's `avatarUrl` as `bot:<kind>`. */
const BOT_PREFIX = 'bot:';

export function botAvatarUrl(kind: AvatarChoice): string {
	return BOT_PREFIX + kind;
}

export function isBotKind(value: string): value is BotKind {
	return (BOT_KINDS as readonly string[]).includes(value);
}

export function isAvatarChoice(value: string): value is AvatarChoice {
	return value === NO_BOT || isBotKind(value);
}

/** The locale key holding a choice's `name` and `trait`. */
export function avatarCopyKey(choice: AvatarChoice): string {
	return choice === NO_BOT ? 'avatar.none' : `avatar.bots.${choice}`;
}

/** The kind in a `bot:<kind>` value; null for anything else, including an unknown kind. */
export function parseBotAvatar(avatarUrl: string | null | undefined): BotKind | null {
	if (!avatarUrl?.startsWith(BOT_PREFIX)) return null;
	const kind = avatarUrl.slice(BOT_PREFIX.length);
	return isBotKind(kind) ? kind : null;
}

/**
 * The bot a user gets until they choose one: picked from the username (FNV-1a),
 * so everyone sees the same character for them on every page.
 */
export function defaultBotFor(username: string): BotKind {
	let hash = 0x811c9dc5;
	for (const char of username.toLowerCase()) {
		hash ^= char.codePointAt(0)!;
		hash = Math.imul(hash, 0x01000193);
	}
	return BOT_KINDS[(hash >>> 0) % BOT_KINDS.length];
}

/**
 * What to draw for a user: the bot they chose, the account icon if they chose no
 * character, else their username's bot. Image URLs that older accounts still hold are ignored.
 */
export function resolveAvatar(username: string, avatarUrl: string | null | undefined): AvatarChoice {
	if (avatarUrl === botAvatarUrl(NO_BOT)) return NO_BOT;
	return parseBotAvatar(avatarUrl) ?? defaultBotFor(username);
}
