import robots from '@/app/robots';

/** Whether a crawler may fetch the path: Disallow is a prefix match, `$` anchors the end. */
function isBlocked(path: string) {
	const { rules } = robots();
	const disallow = [(Array.isArray(rules) ? rules[0] : rules).disallow ?? []].flat();
	return disallow.some((rule) => (rule.endsWith('$') ? path === rule.slice(0, -1) : path.startsWith(rule)));
}

describe('robots.txt', () => {
	it.each(['/account', '/settings/language', '/notifications', '/my-polls', '/following', '/login', '/api/revalidate'])(
		'blocks %s',
		(path) => {
			expect(isBlocked(path)).toBe(true);
		}
	);

	it.each(['/', '/explore', '/poll/abc', '/alice', '/accountant', '/settings2', '/following_me', '/login_x'])(
		'allows %s',
		(path) => {
			expect(isBlocked(path)).toBe(false);
		}
	);
});
