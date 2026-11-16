'use client';

import dynamic from 'next/dynamic';
import {
	cloneElement,
	type ComponentProps,
	type ReactElement,
	type Ref,
	useRef,
	useState,
} from 'react';

import { useActing } from '@/features/communities/ActingProvider';

const loadPollCreator = () => import('./PollCreator').then((m) => m.PollCreator);
const PollCreator = dynamic(loadPollCreator, { ssr: false });

/**
 * The create button renders with the page; the creator's code loads on first
 * hover or focus and mounts on first press, so pages don't pay for the form.
 */
export function CreatePollTrigger({
	children,
	requireAuth,
}: {
	children: ReactElement<ComponentProps<'button'> & { ref?: Ref<HTMLButtonElement> }>;
	/** For guests: asks them to sign in first, then opens the creator (`useRequireAuth`) */
	requireAuth?: (openCreator: () => void) => void;
}) {
	const { acting } = useActing();
	const [mounted, setMounted] = useState(false);
	const [open, setOpen] = useState(false);
	// Not a DialogTrigger, so the dialog is told where focus goes back to on close
	const triggerRef = useRef<HTMLButtonElement>(null);
	const { onClick, onFocus, onPointerEnter } = children.props;
	if (acting?.locked) return null;

	return (
		<>
			{cloneElement(children, {
				ref: triggerRef,
				'aria-haspopup': 'dialog',
				'aria-expanded': open,
				onPointerEnter: (event) => {
					onPointerEnter?.(event);
					loadPollCreator();
				},
				onFocus: (event) => {
					onFocus?.(event);
					loadPollCreator();
				},
				onClick: (event) => {
					onClick?.(event);
					const openCreator = () => {
						setMounted(true);
						setOpen(true);
					};
					if (requireAuth) requireAuth(openCreator);
					else openCreator();
				},
			})}
			{mounted && <PollCreator open={open} onOpenChange={setOpen} finalFocus={triggerRef} />}
		</>
	);
}
