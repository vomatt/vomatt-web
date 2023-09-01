// determine if current page is active or not
export const getActive = ({ pageSlug, query, pathName }) => {
	const slugs = [].concat(query.slug);
	const currentPath = slugs ? slugs.join('/') : pathName.replace(/^\//g, '');
	return currentPath == pageSlug;
};

export const getRoute = ({ type, slug }) => {
	switch (type) {
		case 'pGeneral':
			return `/${slug}`;
		case 'articlePage':
			return `article/${slug}`;
		case 'externalUrl':
			return slug;

		default:
			break;
	}
};

export const getLinkRouteObject = (link) => {
	if (!link) return '';

	return {
		...link,
		route: link && link?.route ? JSON.parse(link.route) : '',
	};
};
