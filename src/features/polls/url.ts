import { pollHref } from '@/lib/routes';

/** A Poll's canonical link on the origin the page is served from. Browser only. */
export function pollUrl(id: string) {
	return `${window.location.origin}${pollHref(id)}`;
}
