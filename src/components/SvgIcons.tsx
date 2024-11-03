export type SvgIconType =
	| 'user-circle-outline'
	| 'chevrons-right'
	| 'chevrons-left'
	| null;

export default function SvgIcons({
	type,
	className,
}: {
	type: SvgIconType;
	className?: string;
}) {
	switch (type) {
		case 'user-circle-outline':
			return (
				<svg
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					className={className}
				>
					<path
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a8.949 8.949 0 0 0 4.951-1.488A3.987 3.987 0 0 0 13 16h-2a3.987 3.987 0 0 0-3.951 3.512A8.948 8.948 0 0 0 12 21Zm3-11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
					/>
				</svg>
			);
		case 'chevrons-right':
			return (
				<svg
					className="svg-icon svg-chevrons-right"
					viewBox="0 0 6 10"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M1 9L5 5L1 1"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			);
		case 'chevrons-left':
			return (
				<svg
					className="svg-icon svg-chevrons-left"
					viewBox="0 0 6 10"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M5 9L1 5L5 1"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			);
		default:
			return null;
	}
}
