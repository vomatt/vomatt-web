import { LinkIcon } from '@sanity/icons';

const Preview = (props) => {
	const { embedSnippet, renderDefault } = props;
	if (!embedSnippet) {
		return <div>Missing Embed Snippet</div>;
	}

	return (
		<div className="iframe-preview">
			{renderDefault({ ...props, title: 'Iframe Embed' })}
			<div dangerouslySetInnerHTML={{ __html: embedSnippet }} />
			<style jsx>{`
				:global(.iframe-preview iframe) {
					width: 100%;
				}
			`}</style>
		</div>
	);
};

const customIframe = ({ ...props } = {}) => {
	return {
		type: 'object',
		title: 'Iframe',
		name: 'iframe',
		icon: LinkIcon,
		fields: [{ title: 'Embed Snippet', name: 'embedSnippet', type: 'text' }],
		preview: {
			select: {
				embedSnippet: 'embedSnippet',
			},
		},
		components: {
			preview: Preview,
		},
		...props,
	};
};
export default customIframe;
