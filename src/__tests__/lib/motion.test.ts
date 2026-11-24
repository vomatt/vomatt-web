import { foldAway } from '@/lib/motion';

/** A list of rows, each with an `animate` that records its keyframes and finishes at once. */
function list(rowStyle: (index: number, count: number) => string, count = 3) {
	const ul = document.createElement('ul');
	const frames: Keyframe[][] = [];
	for (let i = 0; i < count; i++) {
		const li = document.createElement('li');
		li.setAttribute('style', rowStyle(i, count));
		li.animate = ((keyframes: Keyframe[]) => {
			frames[i] = keyframes;
			return { finished: Promise.resolve() };
		}) as unknown as typeof li.animate;
		ul.append(li);
	}
	document.body.append(ul);
	return { rows: [...ul.children], frames };
}

// Tailwind v4's space-y-2: an 8px bottom margin on every row but the last
const spaceY = (i: number, count: number) => (i < count - 1 ? 'margin-bottom: 8px' : '');

afterEach(() => {
	document.body.innerHTML = '';
});

describe('foldAway', () => {
	it('closes a space-y list from the first row\'s own margin, with no jump', async () => {
		const { rows, frames } = list(spaceY);
		await foldAway(rows[0], 8);
		expect(frames[0][0]).toMatchObject({ marginBottom: '8px' });
		expect(frames[0][1]).toMatchObject({ marginBottom: '0px' });
	});

	it('pulls a later row up over the gap above it', async () => {
		const { rows, frames } = list(spaceY);
		await foldAway(rows[2], 8);
		expect(frames[2][0]).toMatchObject({ marginTop: '0px' });
		expect(frames[2][1]).toMatchObject({ marginTop: '-8px' });
	});

	it('closes a flex gap from nothing to minus the gap', async () => {
		const { rows, frames } = list(() => '');
		await foldAway(rows[0], 8);
		expect(frames[0][0]).toMatchObject({ marginBottom: '0px' });
		expect(frames[0][1]).toMatchObject({ marginBottom: '-8px' });
	});

	it('pulls nothing for an only row', async () => {
		const { rows, frames } = list(() => '', 1);
		await foldAway(rows[0], 8);
		expect(frames[0][1]).toMatchObject({ marginBottom: '0px' });
	});

	it('only fades under reduced motion', async () => {
		const matchMedia = window.matchMedia;
		window.matchMedia = ((query: string) => ({ matches: query.includes('reduce') })) as typeof window.matchMedia;
		try {
			const { rows, frames } = list(spaceY);
			await foldAway(rows[1], 8);
			expect(frames[1]).toEqual([{ opacity: 1 }, { opacity: 0 }]);
		} finally {
			window.matchMedia = matchMedia;
		}
	});
});
