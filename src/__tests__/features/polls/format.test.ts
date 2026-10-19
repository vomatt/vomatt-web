import { joinSentences } from '@/features/polls/format';

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
