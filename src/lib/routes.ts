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
		case 'pHome':
			return '/';
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
