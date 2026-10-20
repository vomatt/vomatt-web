'use client';

import { ReactNode } from 'react';

import CustomPortableText from '@/components/CustomPortableText';
import PageModules from '@/components/PageModules';

export default function PageGeneral({ data, children }: { data: any; children?: ReactNode }) {
	const { title, layout, content, pageModules: modules } = data;

	if (layout === 'editor') {
		return (
			<article className="page-general px-contain mx-auto max-w-3xl py-6 md:py-10">
				<h1 className="mb-6 display-heading text-[30px] text-foreground md:text-[40px]">{title}</h1>
				<div className="text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-medium [&_li]:mt-1 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
					{content && <CustomPortableText blocks={content} />}
				</div>
				{children}
			</article>
		);
	}

	return (
		<div className="page-general">
			{modules?.map((module: any, i: number) => (
				<PageModules key={i} module={module} />
			))}
			{children}
		</div>
	);
}
