import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';

import { SegmentedControl } from '@/components/ui/SegmentedControl';

// Base UI dispatches a PointerEvent on click
window.PointerEvent = window.PointerEvent || (MouseEvent as any);

const options = [
	{ value: 'system', label: 'Auto' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
] as const;

type Theme = (typeof options)[number]['value'];

function Controlled({ initial, onChange }: { initial: Theme | undefined; onChange?: (value: Theme) => void }) {
	const [value, setValue] = useState<Theme | undefined>(initial);
	return (
		<SegmentedControl
			label="Theme"
			options={[...options]}
			value={value}
			onValueChange={(next) => {
				setValue(next);
				onChange?.(next);
			}}
		/>
	);
}

describe('SegmentedControl', () => {
	it('is a named radio group with the current choice checked', () => {
		render(<Controlled initial="light" />);
		expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
		expect(screen.getByRole('radio', { name: 'Auto' })).not.toBeChecked();
	});

	it('checks nothing while the value is unknown', () => {
		render(<SegmentedControl label="Theme" options={[...options]} value={undefined} onValueChange={jest.fn()} />);
		for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
	});

	it('reports a clicked choice', () => {
		const onChange = jest.fn();
		render(<Controlled initial="system" onChange={onChange} />);
		fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
		expect(onChange).toHaveBeenCalledWith('dark');
		expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
	});

	it('moves the choice with the arrow keys', async () => {
		const onChange = jest.fn();
		render(<Controlled initial="system" onChange={onChange} />);
		const auto = screen.getByRole('radio', { name: 'Auto' });
		auto.focus();
		fireEvent.keyDown(auto, { key: 'ArrowRight' });
		// Base UI moves focus on the next frame, and focusing a radio checks it
		await waitFor(() => expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus());
		expect(onChange).toHaveBeenLastCalledWith('light');
		expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
	});

	it('keeps only the checked choice in the tab order', () => {
		render(<Controlled initial="dark" />);
		expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('tabindex', '0');
		expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute('tabindex', '-1');
	});
});
