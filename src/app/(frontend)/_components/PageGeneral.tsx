'use client';

import { ReactNode } from 'react';

import CustomPortableText from '@/components/CustomPortableText';
import { PageShell } from '@/components/layout/PageShell';
import PageModules from '@/components/PageModules';

export default function PageGeneral({ data, children }: { data: any; children?: ReactNode }) {
	const { title, layout, content, pageModules: modules } = data;

	if (layout === 'editor') {
		return (
			<PageShell>
				<article className="page-general">
					<h1 className="mb-4 display-heading text-[30px] text-foreground md:text-[40px]">{title}</h1>
					<div className="text-lg leading-[1.6] [&_a]:underline [&_a]:underline-offset-2 [&>*+*]:mt-4 [&_h2]:mt-8 [&_h2]:text-[24px] [&_h2]:leading-[1.3] [&_h2]:font-medium [&_h2]:tracking-[-0.02em] [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
						{content && <CustomPortableText blocks={content} />}
					</div>
					{children}
				</article>
			</PageShell>
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
