import { formatFromNow, joinSentences } from '@/features/polls/format';

describe('formatFromNow', () => {
	const now = new Date('2026-10-24T12:00:00Z');
	const secondsFromNow = (seconds: number) => new Date(now.getTime() + seconds * 1000).toISOString();

	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(now);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('says "just now" for something under a minute old', () => {
		expect(formatFromNow(secondsFromNow(0), 'en')).toBe('just now');
		expect(formatFromNow(secondsFromNow(-59), 'en')).toBe('just now');
	});

	it('says 剛剛 in Chinese', () => {
		expect(formatFromNow(secondsFromNow(-10), 'zh')).toBe('剛剛');
	});

	it('counts minutes from a minute on', () => {
		expect(formatFromNow(secondsFromNow(-60), 'en')).toBe('1 minute ago');
	});

	it('keeps seconds for a moment under a minute away, so "Ends in…" still reads right', () => {
		expect(formatFromNow(secondsFromNow(30), 'en')).toBe('in 30 seconds');
	});
});

describe('joinSentences', () => {
	it('separates English sentences with a space', () => {
		expect(joinSentences('en', 'Anyone can vote.', 'Only you will see.')).toBe(
			'Anyone can vote. Only you will see.'
		);
	});

	it('runs Chinese sentences together, since 。 already separates them', () => {
		expect(joinSentences('zh', '任何人都能投票。', '只有你會看到。')).toBe('任何人都能投票。只有你會看到。');
	});
});
