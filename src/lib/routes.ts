// determine if current page is active or not

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

export const getLinkRouteObject = (link: any) => {
	if (!link) return '';

	return {
		...link,
		route: link && link?.route ? JSON.parse(link.route) : '',
	};
};
