import { render } from '@testing-library/react';

import { BallotMark, stampAngle } from '@/features/polls/components/BallotMotion';

describe('BallotMark', () => {
	it('draws an empty ring at rest', () => {
		const { container } = render(<BallotMark state="rest" />);
		expect(container.firstChild).toHaveClass('border-2', 'border-input');
		expect(container.querySelector('svg')).toBeNull();
	});

	it.each(['selected', 'voted'] as const)('presses the ballot stamp when %s', (state) => {
		const { container } = render(<BallotMark state={state} seed="a" />);
		expect(container.firstChild).toHaveAttribute('data-state', state);
		expect(container.querySelector('svg')).toHaveClass('text-elected');
	});

	it('keeps its angle when the selection is cast', () => {
		const { container, rerender } = render(<BallotMark state="selected" seed="a" />);
		const before = (container.firstChild?.firstChild as HTMLElement).style.transform;
		expect(before).toContain('rotate(');
		rerender(<BallotMark state="voted" seed="a" />);
		expect((container.firstChild?.firstChild as HTMLElement).style.transform).toBe(before);
	});

	it('draws a vote already cast at the same angle every time', () => {
		const angleOf = () => {
			const { container, unmount } = render(<BallotMark state="voted" seed="a" />);
			const transform = (container.firstChild?.firstChild as HTMLElement).style.transform;
			unmount();
			return transform;
		};
		const first = angleOf();
		expect(first).toContain('rotate(');
		expect(angleOf()).toBe(first);
	});

	it('redraws a cast stamp at the angle it was pressed at', () => {
		const transformOf = (container: HTMLElement) => (container.firstChild?.firstChild as HTMLElement).style.transform;
		const pressed = render(<BallotMark state="selected" seed="pressed-once" />);
		const animate = transformOf(pressed.container).match(/rotate\([^)]*\)/)![0];
		pressed.unmount();
		const { container } = render(<BallotMark state="voted" seed="pressed-once" />);
		expect(transformOf(container)).toBe(animate);
	});
});

describe('stampAngle', () => {
	it.each([
		[0, 0],
		[0.25, 90],
		[0.5, 180],
		[0.75, 270],
	])('turns a press anywhere in the full circle (r=%s → %s°)', (r, degrees) => {
		expect(stampAngle(r)).toBe(degrees);
	});
});
