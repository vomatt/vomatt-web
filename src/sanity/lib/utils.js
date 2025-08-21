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

	let contentWithText = content.filter(
		(el) => el._type == 'block' && el?.children[0]?.text !== ''
	);
	let contentWithIframe = content.filter((el) => el._type == 'iframe');
	let contentWithImageAlt = content.filter(
		(el) => el._type == 'image' && el.alt
	);

	let contentWithImage = content.filter((el) => el._type == 'image');
	let contentWithTable = content.filter((el) => el._type == 'portableTable');
	if (contentWithText && contentWithText[0]) {
		const textChildren = contentWithText[0]?.children;
		if (!Array.isArray(textChildren)) {
			return '';
		}

		if (textChildren.length === 1) {
			return textChildren[0]?.text || '';
		}
		return textChildren.map((item) => item?.text || '').join('');
	}

	if (contentWithIframe && contentWithIframe[0]) {
		const { embedSnippet } = contentWithIframe[0] || '';
		const regex = /<iframe.*?src=['"](.*?)['"]/;

		const getUrl = (embedSnippet) => {
			const url = regex.exec(embedSnippet)[1];
			if (url.includes('youtube.com') || url.includes('youtu.be')) {
				return 'youtube.com';
			}
			if (url.includes('vimeo.com')) {
				return 'vimeo.com';
			}
			return url;
		};

		return `Iframe Embed: ${getUrl(embedSnippet)}`;
	}

	if (contentWithImageAlt && contentWithImageAlt[0]) {
		return contentWithImageAlt[0].alt;
	}

	// with image but no alt, show "image"
	if (contentWithImage && contentWithImage[0]) {
		return `Image${contentWithImage.length > 1 ? 's' : ''}`;
	}

	if (contentWithTable) {
		return `Table${contentWithTable.length > 1 ? 's' : ''}`;
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

export const singletonPlugin = (types) => {
	return {
		name: 'singletonPlugin',
		document: {
			// Hide 'Singletons (such as Home)' from new document options
			newDocumentOptions: (prev, { creationContext }) => {
				if (creationContext.type === 'global') {
					return prev.filter(
						(templateItem) => !types.includes(templateItem.templateId)
					);
				}

				return prev;
			},
			// Removes the "duplicate" action on the Singletons (such as Home)
			actions: (prev, { schemaType }) => {
				if (types.includes(schemaType)) {
					return prev.filter(({ action }) => action !== 'duplicate');
				}

				return prev;
			},
		},
	};
};
