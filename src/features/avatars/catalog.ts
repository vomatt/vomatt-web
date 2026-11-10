/** The cast: 60 characters in six families, in display order. */
export const BOT_FAMILIES = {
	bites: ['boba', 'bao', 'oolong', 'su', 'ice', 'youtiao', 'chip', 'tower', 'lumen'],
	guardians: ['mazu', 'tudi', 'yuelao', 'qiye', 'baye', 'long', 'denglong', 'jiaobei', 'xiang'],
	visitors: ['gray', 'nordic', 'reptile', 'mantis', 'anu', 'tallwhite', 'moth', 'cyclops', 'trio'],
	animals: ['bear', 'magpie', 'pangolin', 'shihu', 'macaque', 'deer', 'pheasant', 'flyfish', 'dog'],
	cats: ['fold', 'munchkin', 'chinchilla', 'mainecoon', 'siamese', 'orange', 'tuxedo', 'calico', 'sphynx', 'ragdoll', 'british', 'bengal'],
	dogs: ['shiba', 'corgi', 'golden', 'husky', 'pug', 'dachshund', 'poodle', 'frenchie', 'beagle', 'collie', 'dalmatian', 'labrador'],
} as const;

export type BotFamily = keyof typeof BOT_FAMILIES;
export type BotKind = (typeof BOT_FAMILIES)[BotFamily][number];

export const BOT_KINDS: readonly BotKind[] = Object.values(BOT_FAMILIES).flat();

type BotTint = 'sand' | 'stone' | 'green' | 'sky' | 'peach' | 'lavender';

/** The circle behind each character; `bg-avatar-<tint>` in global.css. */
export const BOT_TINTS: Record<BotKind, BotTint> = {
	boba: 'sand', bao: 'stone', oolong: 'green', su: 'sand', ice: 'sky',
	youtiao: 'sand', chip: 'sky', tower: 'sky', lumen: 'peach',
	mazu: 'sky', tudi: 'sand', yuelao: 'lavender', qiye: 'stone', baye: 'peach',
	long: 'peach', denglong: 'peach', jiaobei: 'peach', xiang: 'sand',
	gray: 'stone', nordic: 'sky', reptile: 'green', mantis: 'peach', anu: 'sand', tallwhite: 'lavender',
	moth: 'lavender', cyclops: 'sky', trio: 'green',
	bear: 'stone', magpie: 'sky', pangolin: 'sand', shihu: 'peach', macaque: 'lavender', deer: 'green',
	pheasant: 'sand', flyfish: 'sky', dog: 'sand',
	fold: 'stone', munchkin: 'peach', chinchilla: 'lavender', mainecoon: 'stone', siamese: 'sky', orange: 'sand',
	tuxedo: 'stone', calico: 'peach', sphynx: 'peach', ragdoll: 'sky', british: 'stone', bengal: 'sand',
	shiba: 'sand', corgi: 'sand', golden: 'sand', husky: 'sky', pug: 'sand', dachshund: 'sand',
	poodle: 'peach', frenchie: 'stone', beagle: 'peach', collie: 'stone', dalmatian: 'stone', labrador: 'sand',
};

/** No character: the user removed their avatar for the plain account icon, stored as `bot:none`. Never a default. */
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
 * Defaults are picked from the original cast of 72, so usernames keep their character
 * as the cast shrinks. These are the slots of the characters since retired, ascending.
 */
const ORIGINAL_CAST_SIZE = 72;
const RETIRED_SLOTS = [4, 7, 8, 17, 20, 23, 31, 33, 34, 43, 44, 46];

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
	hash >>>= 0;
	const slot = hash % ORIGINAL_CAST_SIZE;
	if (RETIRED_SLOTS.includes(slot)) return BOT_KINDS[hash % BOT_KINDS.length];
	return BOT_KINDS[slot - RETIRED_SLOTS.filter((retired) => retired < slot).length];
}

/**
 * What to draw for a user: the bot they chose, the account icon if they chose no
 * character or one since retired, else their username's bot. Image URLs that older accounts still hold are ignored.
 */
export function resolveAvatar(username: string, avatarUrl: string | null | undefined): AvatarChoice {
	if (avatarUrl?.startsWith(BOT_PREFIX)) return parseBotAvatar(avatarUrl) ?? NO_BOT;
	return defaultBotFor(username);
}

const UPLOADED_AVATAR = /^\/api\/avatars\/[\w-]+\.jpg$/;

/** The path of an uploaded avatar (`/api/avatars/<id>.jpg`, served through this host's rewrite); null for a bot or anything else. */
export function uploadedAvatarSrc(avatarUrl: string | null | undefined): string | null {
	return avatarUrl && UPLOADED_AVATAR.test(avatarUrl) ? avatarUrl : null;
}

/** Bounds the full-size decode in the browser; what's uploaded is the 512px crop, far under the API's 2 MB. */
export const AVATAR_PICK_MAX_BYTES = 25 * 1024 * 1024;
/** Image types the API accepts; checked on pick so an unsupported file never reaches the crop step. */
export const AVATAR_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];

export function avatarFileProblem(file: File): string | null {
	if (file.size === 0 || !AVATAR_UPLOAD_TYPES.includes(file.type)) return 'avatar.upload.unsupported';
	if (file.size > AVATAR_PICK_MAX_BYTES) return 'avatar.upload.tooLarge';
	return null;
}
