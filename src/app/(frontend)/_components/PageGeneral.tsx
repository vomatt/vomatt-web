'use client';

import { RichText } from '@payloadcms/richtext-lexical/react';

export default function PageGeneral({ data }: { data: any }) {
	const { content } = data;

	return (
		<div className="page-general">
			{content && <RichText data={content} />}
		</div>
	);
}
