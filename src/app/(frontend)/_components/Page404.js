'use client';

import CMSLink from '@/components/CMSLink';

export default function Page404({ data }) {
	const { heading, callToAction } = data ?? {};

	return (
		<div className="p-404 f-v f-j-c">
			<div className="c-4 wysiwyg">
				<h1>{heading || 'Page not found'}</h1>
				{callToAction && (
					<CMSLink
						link={callToAction.link}
						isNewTab={callToAction.isNewTab}
						title={callToAction.label}
						isButton={true}
					/>
				)}
			</div>
		</div>
	);
}
