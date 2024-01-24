'use client';

import CustomLink from '@/components/CustomLink';
import CustomPortableText from '@/components/CustomPortableText';

export default function Page404({ data }) {
	const { heading, paragraph, callToAction } = data ?? {};

	return (
		<div className="p-404 f-v f-j-c">
			<div className="c-4 wysiwyg">
				<h1>{heading || 'Page not found'}</h1>

				{paragraph && <CustomPortableText blocks={paragraph} />}

				{callToAction && (
					<CustomLink
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
