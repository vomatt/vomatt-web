export const FEED_TAG = 'polls-feed';
/** Every cached Poll: each names its creator, so a change to anyone's names or their visibility expires them all. */
export const POLLS_TAG = 'polls';

export function pollTag(id: string) {
	return `poll:${id}`;
}
