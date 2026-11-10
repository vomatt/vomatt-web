/** An element's text as it shows on screen: without the sr-only copies (such as WinnerName's whole name for screen readers). */
export function visibleText(element: Element) {
	const clone = element.cloneNode(true) as Element;
	clone.querySelectorAll('.sr-only').forEach((node) => node.remove());
	return clone.textContent;
}
