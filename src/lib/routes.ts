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
