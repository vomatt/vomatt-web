import clsx from 'clsx';
import { useId } from 'react';

import { LoadingLabel } from '@/components/ui/LoadingLabel';
import { markLoaderSvg } from '@/lib/brand/mark';

// A pending Suspense fallback is never hydrated, so the label is inserted by a script the
// browser runs while parsing it. An inserted node is announced; unhiding one may not be.
// It goes in as inner HTML because React warns when the client creates a script element,
// which it does if it client-renders the boundary before hydrating it.
const ANNOUNCE_AFTER_300MS = `<script>(() => {
	const status = document.currentScript.closest('[role=status]');
	setTimeout(() => status.append(status.querySelector('[hidden]').firstElementChild.cloneNode(true)), 300);
})();</script>`;

/**
 * The glossy mark with a ballot dropping into its slot, shared with SessionRetry so the two
 * screens match when one replaces the other. Decorative: the caller carries the status. A
 * server component, so the drawing code stays out of the client bundle.
 */
export function MarkLoader({ className }: { className?: string }) {
	const id = useId();
	return (
		<span
			aria-hidden
			className={clsx('animate-ballot-drop block size-28 [&>svg]:size-full', className)}
			dangerouslySetInnerHTML={{ __html: markLoaderSvg(`${id}-`) }}
		/>
	);
}

/**
 * The first-load splash: the mark with a ballot dropping into it. Mark and label both
 * appear after 300ms, so quick loads are neither shown nor announced.
 */
export function BrandPulse() {
	return (
		<div role="status" className="flex min-h-svh items-center justify-center">
			<MarkLoader className="animate-in fade-in delay-300 duration-200 ease-out fill-mode-both" />
			<span hidden>
				<LoadingLabel />
			</span>
			<span hidden dangerouslySetInnerHTML={{ __html: ANNOUNCE_AFTER_300MS }} />
		</div>
	);
}
