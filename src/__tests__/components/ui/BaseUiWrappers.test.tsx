import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Link from 'next/link';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { SidebarMenuButton, SidebarProvider } from '@/components/ui/Sidebar';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

// Polyfill APIs missing in jsdom
global.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
} as any;

// Base UI's Switch dispatches a PointerEvent on click
window.PointerEvent = window.PointerEvent || (MouseEvent as any);

window.matchMedia =
	window.matchMedia ||
	((query: string) =>
		({
			matches: false,
			media: query,
			addEventListener() {},
			removeEventListener() {},
		}) as unknown as MediaQueryList);

describe('Base UI wrappers', () => {
	it('Button renders a native button with its variant styling', () => {
		const onClick = jest.fn();
		render(
			<Button size="sm" onClick={onClick}>
				Save
			</Button>
		);
		const button = screen.getByRole('button', { name: 'Save' });
		expect(button.tagName).toBe('BUTTON');
		expect(button).toHaveAttribute('data-slot', 'button');
		expect(button.className).toContain('h-7');

		fireEvent.click(button);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('Dialog close button closes the dialog', async () => {
		const onOpenChange = jest.fn();
		render(
			<Dialog open onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogTitle>Title</DialogTitle>
				</DialogContent>
			</Dialog>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		await waitFor(() =>
			expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
		);
	});

	it('AlertDialogCancel closes, AlertDialogAction does not close on its own', async () => {
		const onOpenChange = jest.fn();
		const onAction = jest.fn();
		render(
			<AlertDialog open onOpenChange={onOpenChange}>
				<AlertDialogContent>
					<AlertDialogTitle>Sure?</AlertDialogTitle>
					<AlertDialogCancel>Keep</AlertDialogCancel>
					<AlertDialogAction onClick={onAction}>Delete</AlertDialogAction>
				</AlertDialogContent>
			</AlertDialog>
		);

		fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		expect(onAction).toHaveBeenCalledTimes(1);
		expect(onOpenChange).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
		await waitFor(() =>
			expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
		);
	});

	it('Tabs marks the selected tab active and shows its panel', () => {
		render(
			<Tabs defaultValue="a">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b">B</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Panel A</TabsContent>
				<TabsContent value="b">Panel B</TabsContent>
			</Tabs>
		);
		expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute(
			'data-active'
		);

		fireEvent.click(screen.getByRole('tab', { name: 'B' }));
		expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute(
			'data-active'
		);
		expect(screen.getByText('Panel B')).toBeVisible();
	});

	it('Switch toggles its checked state', () => {
		const onCheckedChange = jest.fn();
		render(<Switch aria-label="Notify" onCheckedChange={onCheckedChange} />);
		const toggle = screen.getByRole('switch', { name: 'Notify' });
		expect(toggle).toHaveAttribute('data-unchecked');

		fireEvent.click(toggle);
		expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
		expect(toggle).toHaveAttribute('data-checked');
	});

	it('SidebarMenuButton renders a link and only marks it active when active', () => {
		render(
			<SidebarProvider>
				<SidebarMenuButton render={<Link href="/" />} isActive>
					Home
				</SidebarMenuButton>
				<SidebarMenuButton render={<Link href="/me" />}>Me</SidebarMenuButton>
			</SidebarProvider>
		);
		const home = screen.getByRole('link', { name: 'Home' });
		expect(home).toHaveAttribute('data-slot', 'sidebar-menu-button');
		expect(home).toHaveAttribute('data-active');
		expect(screen.getByRole('link', { name: 'Me' })).not.toHaveAttribute(
			'data-active'
		);
	});
});
