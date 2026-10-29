import { readdirSync, readFileSync } from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '../..');

function serverModules(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return entry.name === '__tests__' ? [] : serverModules(full);
		return /\.tsx?$/.test(entry.name) && /^['"]use server['"]/m.test(readFileSync(full, 'utf8')) ? [full] : [];
	});
}

describe("'use server' modules", () => {
	it('export only async functions and types', () => {
		const offenders = serverModules(SRC).flatMap((file) =>
			readFileSync(file, 'utf8')
				.split('\n')
				.filter((line) => /^export\s+(const|let|var|class|enum|function\s|default\s+(?!async))/.test(line))
				.map((line) => `${path.relative(SRC, file)}: ${line.trim()}`)
		);
		expect(offenders).toEqual([]);
	});
});
