import { shareDescription } from '@/features/polls/sharePreview';

const options = [{ text: 'Tea' }, { text: 'Coffee' }] as never;

describe('shareDescription', () => {
	it('shows the context followed by the options', () => {
		expect(shareDescription({ description: 'Morning drink?', options })).toBe(
			'Morning drink?\nTea / Coffee',
		);
	});

	it('shows only the options when there is no context', () => {
		expect(shareDescription({ description: '  ', options })).toBe('Tea / Coffee');
	});
});
