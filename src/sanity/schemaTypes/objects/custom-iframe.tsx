'use client';
import { LinkIcon } from '@sanity/icons/Link';
import { defineArrayMember, type PreviewProps } from 'sanity';

const Preview = (props: PreviewProps & { embedSnippet?: string }) => {
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

export default function customIframe({ ...props } = {}) {
	return defineArrayMember({
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
	});
}
