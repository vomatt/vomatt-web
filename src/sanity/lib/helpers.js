export const getTypeTitles = (types) => {
	const typeNames = types.map((type) => {
		switch (type) {
			case 'freeform':
				return 'Freeform';
			case 'accordionList':
				return 'Accordion List';
			default:
				return null;
		}
	});

	return typeNames.join(' + ');
};

export const getTypeSubtitle = (block) => {
	switch (block._type) {
		case 'freeform':
			return getPortableTextPreview(block?.content[0]);
		case 'accordionList':
			return `${block?.items.length} item(s)`;

		default:
			return null;
	}
};

export const getPortableTextPreview = (content) => {
	if (!content) {
		return 'Empty';
	}

	let contentWithIframe = content.filter((el) => el._type == 'iframe');
	if (contentWithIframe && contentWithIframe[0]) {
		const { embedSnippet } = contentWithIframe[0] || '';
		const regex = /<iframe.*?src=['"](.*?)['"]/;

		const getUrl = (embedSnippet) => {
			const url = regex.exec(embedSnippet)[1];
			if (url.includes('youtube.com')) {
				return 'youtube.com';
			}
			if (url.includes('vimeo.com')) {
				return 'vimeo.com';
			}
			return url;
		};

		return `Iframe: ${getUrl(embedSnippet)}`;
	}

	let contentWithText = content.filter(
		(el) => el._type != 'image' && el?.children[0]?.text !== ''
	);
	let contentWithImageAlt = content.filter(
		(el) => el._type == 'image' && el.alt
	);

	let contentWithImage = content.filter((el) => el._type == 'image');

	if (contentWithText && contentWithText[0]) {
		return contentWithText[0].children[0].text;
	}

	if (contentWithImageAlt && contentWithImageAlt[0]) {
		return contentWithImageAlt[0].alt;
	}

	// with image but no alt, show "image"
	if (contentWithImage && contentWithImage[0]) {
		return `Image${contentWithImage.length > 1 ? 's' : ''}`;
	}

	return 'Empty';
};

export const getSwatch = (color) => {
	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				backgroundColor: color,
			}}
		></div>
	);
};

export const assemblePageUrl = ({ document, options }) => {
	const { slug } = document;
	const { previewURL } = options;
	if (!previewURL) {
		console.warn('Missing preview URL', { slug, previewURL });
		return '';
	}

	return previewURL + (slug ? `/${slug.current}` : '');
};

export const decodeAssetUrl = (id) => {
	const pattern = /^(?:image|file)-([a-f\d]+)-(?:(\d+x\d+)-)?(\w+)$/;
	const [, assetId, dimensions, format] = pattern.exec(id);

	const [width, height] = dimensions
		? dimensions.split('x').map((v) => parseInt(v, 10))
		: [];

	return {
		assetId,
		dimensions: { width, height },
		format,
	};
};
