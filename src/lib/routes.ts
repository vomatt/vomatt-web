export const checkIfActive = ({
	pathName,
	url,
	isChild,
}: {
	pathName: string;
	url: string;
	isChild?: any;
}) => {
	if (isChild) {
		return pathName.split('/')[1] == url.split('/')[1];
	} else {
		return pathName == url;
	}
};

export const resolveHref = ({
	documentType,
	slug,
}: {
	documentType: string | undefined;
	slug: string | undefined;
}) => {
	switch (documentType) {
		case 'pHome':
			return '/';
		case 'pGeneral':
			return `/${slug}`;
		case 'articlePage':
			return `/article/${slug}`;
		case 'externalUrl':
			return slug;

		default:
			console.warn('Invalid document type:', documentType);
			return slug ? `/${slug}` : undefined;
	}
};

export const getWindowURl = (windowUrl: string) => {
	if (windowUrl.includes('localhost:')) {
		return `http://${windowUrl}`;
	}
	return `https://${windowUrl}`;
};

/** The home feed filtered to one topic. */
export const topicHref = (slug: string) => `/?tag=${encodeURIComponent(slug)}`;

// Only same-origin paths; blocks open redirects like `//evil.com`, `/\\evil.com`
// or `/\t/evil.com` by resolving the path the same way the browser will.
export function getSafeRedirectPath(path: string | null) {
	if (!path?.startsWith('/')) return '/';
	const base = 'http://localhost';
	const url = new URL(path, base);
	if (url.origin !== base) return '/';
	return `${url.pathname}${url.search}${url.hash}`;
}
