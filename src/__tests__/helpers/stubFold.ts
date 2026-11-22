/**
 * Gives jsdom an Element.animate, so `foldAway` runs its fold instead of resolving at once.
 * Each fold waits until `finish()`; `folded` lists the elements folded so far. Call `restore()` after.
 */
export function stubFold() {
	const folded: Element[] = [];
	const pending: (() => void)[] = [];
	const proto = HTMLElement.prototype as { animate?: unknown };
	const original = proto.animate;
	proto.animate = function (this: Element) {
		folded.push(this);
		return { finished: new Promise<void>((resolve) => pending.push(resolve)) };
	};
	return {
		folded,
		finish: () => pending.splice(0).forEach((resolve) => resolve()),
		restore: () => {
			if (original) proto.animate = original;
			else delete proto.animate;
		},
	};
}
