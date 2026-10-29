/**
 * @jest-environment node
 */
import { readdirSync } from 'fs';
import path from 'path';

import { isValidUsername } from '@/features/account/username';
import { APP_ROOT_SEGMENTS } from '@/lib/routes';

describe('APP_ROOT_SEGMENTS', () => {
	it('lists every top-level route folder in app/(frontend)', () => {
		const folders = readdirSync(path.join(__dirname, '../../app/(frontend)'), { withFileTypes: true })
			.filter((entry) => entry.isDirectory() && !/^[[_(]/.test(entry.name))
			.map((entry) => entry.name);

		expect([...APP_ROOT_SEGMENTS].sort()).toEqual(folders.sort());
	});

	it.each(APP_ROOT_SEGMENTS)('can not be taken as a username: %s', (segment) => {
		expect(isValidUsername(segment)).toBe(false);
	});
});
