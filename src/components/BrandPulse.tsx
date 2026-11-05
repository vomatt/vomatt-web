import BrandLogo from '@/components/BrandLogo';
import { LoadingLabel } from '@/components/ui/LoadingLabel';

// A pending Suspense fallback is never hydrated, so the label is inserted by a script the
// browser runs while parsing it. An inserted node is announced; unhiding one may not be.
const ANNOUNCE_AFTER_300MS = `(() => {
	const status = document.currentScript.parentElement;
	setTimeout(() => status.append(status.querySelector('[hidden]').firstElementChild.cloneNode(true)), 300);
})();`;

/** The pulsing wordmark's look, shared with SessionRetry so the two screens match when one replaces the other. */
export const PULSING_WORDMARK = 'animate-wordmark-pulse block w-40';

/**
 * The first-load splash: the wordmark with opacity running along its letters. Wordmark and
 * label both appear after 300ms, so quick loads are neither shown nor announced.
 */
export function BrandPulse() {
	return (
		<div role="status" className="flex min-h-svh items-center justify-center">
			<BrandLogo className={`${PULSING_WORDMARK} animate-in fade-in delay-300 duration-200 ease-out fill-mode-both`} />
			<span hidden>
				<LoadingLabel />
			</span>
			<script dangerouslySetInnerHTML={{ __html: ANNOUNCE_AFTER_300MS }} />
		</div>
	);
}
