import { fireEvent, render, screen } from '@testing-library/react';

import { Button, buttonVariants } from '@/components/ui/Button';

describe('Button loading', () => {
	it('marks the button busy and keeps its label in the accessible name', () => {
		render(<Button loading>Publish</Button>);
		const button = screen.getByRole('button', { name: /Publish/ });
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(button).toHaveAttribute('data-loading');
	});

	it('announces that it is loading', () => {
		render(<Button loading>Publish</Button>);
		expect(screen.getByRole('status')).toHaveTextContent('Loading');
	});

	it('does not remount its children when loading starts', () => {
		const { rerender } = render(
			<Button>
				<span data-testid="child">Publish</span>
			</Button>
		);
		const child = screen.getByTestId('child');
		rerender(
			<Button loading>
				<span data-testid="child">Publish</span>
			</Button>
		);
		expect(screen.getByTestId('child')).toBe(child);
	});

	it('stays focusable instead of natively disabled, so focus is not lost', () => {
		render(<Button loading>Publish</Button>);
		const button = screen.getByRole('button', { name: /Publish/ });
		expect(button).not.toHaveAttribute('disabled');
		expect(button).toHaveAttribute('aria-disabled', 'true');
	});

	it('stays focusable even when the caller also disables it', () => {
		render(
			<Button loading disabled>
				Publish
			</Button>
		);
		expect(screen.getByRole('button', { name: /Publish/ })).not.toHaveAttribute('disabled');
	});

	it('ignores clicks while loading', () => {
		const onClick = jest.fn();
		render(
			<Button loading onClick={onClick}>
				Publish
			</Button>
		);
		fireEvent.click(screen.getByRole('button', { name: /Publish/ }));
		expect(onClick).not.toHaveBeenCalled();
	});

	it('does not submit its form a second time while loading', () => {
		const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
		render(
			<form onSubmit={onSubmit}>
				<Button type="submit" loading>
					Continue
				</Button>
			</form>
		);
		fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('shows a custom loading icon in place of the spinner', () => {
		render(
			<Button loading loadingIcon={<svg data-testid="ballot-icon" />}>
				Vote
			</Button>
		);
		const button = screen.getByRole('button', { name: /Vote/ });
		expect(button.querySelector('[data-testid="ballot-icon"]')).toBeInTheDocument();
		expect(button.querySelector('.animate-spin')).not.toBeInTheDocument();
	});

	it('is a plain button when not loading', () => {
		const onClick = jest.fn();
		render(<Button onClick={onClick}>Publish</Button>);
		const button = screen.getByRole('button', { name: /Publish/ });
		expect(button).not.toHaveAttribute('aria-busy');
		expect(button).not.toHaveAttribute('aria-disabled');
		fireEvent.click(button);
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});

describe('buttonVariants', () => {
	it("lets the variant's border win over the base's, for a Link styled as a button", () => {
		const classes = buttonVariants({ variant: 'outline' }).split(' ');
		expect(classes).toContain('border-border-strong');
		expect(classes).not.toContain('border-transparent');
	});

	it('dims an aria-disabled button like a disabled one, so a button that keeps focus still looks unavailable', () => {
		expect(buttonVariants().split(' ')).toContain('aria-disabled:opacity-50');
	});
});

describe('Button sizes', () => {
	// Every size keeps a 44px touch target on phones and only shrinks from md up
	it.each([
		['md', 'md:h-10'],
		['sm', 'md:h-9'],
		['xs', 'md:h-8'],
	] as const)('%s is 44px on phones and %s from md', (size, desktop) => {
		render(<Button size={size}>Save</Button>);
		expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('h-11', desktop);
	});

	it('icon-xs is a 44px circle on phones and 32px from md', () => {
		render(<Button size="icon-xs" aria-label="More" />);
		expect(screen.getByRole('button', { name: 'More' })).toHaveClass('size-11', 'md:size-8', 'rounded-full');
	});

	it('default stays 44px at every width', () => {
		render(<Button>Vote</Button>);
		const classes = screen.getByRole('button', { name: 'Vote' }).className.split(' ');
		expect(classes).toContain('h-11');
		expect(classes.some((c) => c.startsWith('md:h-'))).toBe(false);
	});
});
