import type { SVGProps } from 'react';

/** The icon of an empty or missing page (EmptyCard). */
export function CircleMinus({ size = '1em', ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<circle cx="12" cy="12" r="9" />
			<path d="M8 12h8" />
		</svg>
	);
}
