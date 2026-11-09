'use client';

import { Menu } from '@base-ui/react/menu';
import { useRef, useState } from 'react';

import { useCloseOnScrollAway } from '@/hooks/useCloseOnScrollAway';

/** A row's ••• menu. Touch screens scroll the page under an open menu, so it closes once its trigger is scrolled away. */
export function RowMenuRoot({ onOpenChange, ...props }: Menu.Root.Props) {
	const actionsRef = useRef<Menu.Root.Actions>(null);
	// The trigger the menu is open on; none while closed
	const [anchor, setAnchor] = useState<Element | null>(null);
	useCloseOnScrollAway(anchor, () => actionsRef.current?.close());

	return (
		<Menu.Root
			{...props}
			actionsRef={actionsRef}
			onOpenChange={(open, details) => {
				setAnchor(open ? (details.trigger ?? null) : null);
				onOpenChange?.(open, details);
			}}
		/>
	);
}
