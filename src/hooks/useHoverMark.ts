import { type PointerEvent, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export interface HoverMark {
	/** Offset and size of the hovered item along the axis, inside the container's padding box. */
	rect: { offset: number; size: number } | null;
	/** False once the pointer leaves: the mark fades out where it was. */
	visible: boolean;
	/** The pointer just came in, so the mark appears in place instead of sliding from where it left. */
	entering: boolean;
	axis: 'x' | 'y';
}

/**
 * Tracks the item under the pointer inside a container, for a mark that glides
 * between items. Spread `onPointerOver`/`onPointerLeave` on the container.
 * Touch and pen are ignored: a tap would only flash the mark.
 */
export function useHoverMark(itemSelector: string, axis: 'x' | 'y') {
	const containerRef = useRef<HTMLElement | null>(null);
	const [hovered, setHovered] = useState<HTMLElement | null>(null);
	const [entering, setEntering] = useState(false);
	const [rect, setRect] = useState<HoverMark['rect']>(null);

	// Measured again whenever the item or container resizes
	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!hovered || !container) return;
		const measure = () => {
			const item = hovered.getBoundingClientRect();
			const box = container.getBoundingClientRect();
			const next =
				axis === 'x'
					? { offset: item.left - box.left + container.scrollLeft - container.clientLeft, size: item.width }
					: { offset: item.top - box.top + container.scrollTop - container.clientTop, size: item.height };
			setRect((prev) => (prev?.offset === next.offset && prev.size === next.size ? prev : next));
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(hovered);
		observer.observe(container);
		return () => observer.disconnect();
	}, [hovered, axis]);

	function onPointerOver(event: PointerEvent<HTMLElement>) {
		if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
		const item = (event.target as Element).closest<HTMLElement>(itemSelector);
		if (!item || item === hovered || item.hasAttribute('data-disabled')) return;
		containerRef.current = event.currentTarget;
		setEntering(hovered === null);
		setHovered(item);
	}

	function onPointerLeave() {
		setHovered(null);
	}

	const mark: HoverMark = { rect, visible: hovered !== null, entering, axis };
	return { mark, onPointerOver, onPointerLeave };
}

/** Glide, fade and position for the mark element; `className` gives its look (fill, placement). */
export function hoverMarkProps({ rect, visible, entering, axis }: HoverMark, className: string) {
	const x = axis === 'x';
	return {
		className: cn(
			className,
			'duration-200 ease-out motion-reduce:transition-none',
			entering ? 'transition-opacity' : x ? 'transition-[left,width,opacity]' : 'transition-[top,height,opacity]',
			!visible && 'opacity-0'
		),
		style: rect ? (x ? { left: rect.offset, width: rect.size } : { top: rect.offset, height: rect.size }) : undefined,
	};
}
