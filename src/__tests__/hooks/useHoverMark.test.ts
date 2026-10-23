import { hoverMarkProps } from '@/hooks/useHoverMark';

const rect = { offset: 12, size: 30 };

it('places a horizontal mark by left and width', () => {
	const props = hoverMarkProps(
		{ rect, visible: true, entering: false, axis: 'x' },
		'fill'
	);
	expect(props.style).toEqual({ left: 12, width: 30 });
	expect(props.className).toContain('transition-[left,width,opacity]');
});

it('places a vertical mark by top and height', () => {
	const props = hoverMarkProps(
		{ rect, visible: true, entering: false, axis: 'y' },
		'fill'
	);
	expect(props.style).toEqual({ top: 12, height: 30 });
	expect(props.className).toContain('transition-[top,height,opacity]');
});

it('fades in place when the pointer comes back, and out when it leaves', () => {
	const entering = hoverMarkProps(
		{ rect, visible: true, entering: true, axis: 'y' },
		'fill'
	);
	expect(entering.className).toContain('transition-opacity');
	expect(entering.className).not.toContain('transition-[top');
	const gone = hoverMarkProps(
		{ rect, visible: false, entering: false, axis: 'y' },
		'fill'
	);
	expect(gone.className).toContain('opacity-0');
});
