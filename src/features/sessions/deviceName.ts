const BROWSERS: [RegExp, string][] = [
	[/Edg(?:e|A|iOS)?\//, 'Edge'],
	[/OPR\/|Opera/, 'Opera'],
	[/Firefox\/|FxiOS\//, 'Firefox'],
	[/Chrome\/|CriOS\//, 'Chrome'],
	[/Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
	[/iPhone/, 'iPhone'],
	[/iPad/, 'iPad'],
	[/Android/, 'Android'],
	[/Windows/, 'Windows'],
	[/Mac OS X|Macintosh/, 'Mac'],
	[/CrOS/, 'ChromeOS'],
	[/Linux/, 'Linux'],
];

/** "Chrome · Mac" from a raw User-Agent; null when it names neither, so the caller shows an unknown device. */
export function deviceName(userAgent: string | null): string | null {
	if (!userAgent) return null;
	const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
	const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
	if (browser && system) return `${browser} · ${system}`;
	return browser ?? system ?? null;
}
