/**
 * @jest-environment node
 */
import { readdirSync } from 'fs';
import path from 'path';

import { isValidUsername } from '@/features/account/username';
import { APP_ROOT_SEGMENTS } from '@/lib/routes';

describe('APP_ROOT_SEGMENTS', () => {
	it('lists every top-level route folder in app/(frontend), route groups included', () => {
		// A route group adds no URL segment, so its folders are top-level routes too
		const rootSegments = (dir: string): string[] =>
			readdirSync(dir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory() && !/^[[_]/.test(entry.name))
				.flatMap((entry) => (entry.name.startsWith('(') ? rootSegments(path.join(dir, entry.name)) : [entry.name]));
		const folders = [...new Set(rootSegments(path.join(__dirname, '../../app/(frontend)')))];

		expect([...APP_ROOT_SEGMENTS].sort()).toEqual(folders.sort());
	});

	it.each(APP_ROOT_SEGMENTS)('can not be taken as a username: %s', (segment) => {
		expect(isValidUsername(segment)).toBe(false);
	});
});
