import { ReactNode } from 'react';

import CustomPortableText from '@/components/CustomPortableText';
import { PageShell } from '@/components/layout/PageShell';
import PageModules, { type PageModule } from '@/components/PageModules';

export default function PageGeneral({ data, children }: { data: any; children?: ReactNode }) {
	const { title, layout, content, pageModules: modules } = data;

	if (layout === 'editor') {
		return (
			<PageShell>
				<article className="page-general">
					<h1 className="mb-4 display-heading text-[30px] text-foreground md:text-[40px]">{title}</h1>
					<div className="cms-prose text-lg">
						{content && <CustomPortableText blocks={content} />}
					</div>
					{children}
				</article>
			</PageShell>
		);
	}

	// A Hero with a heading carries the page's h1; without one the title still names the page
	const hasHeroHeading = modules?.some((module: PageModule) => module._type === 'hero' && module.heading);

	return (
		<PageShell>
			<div className="page-general flex flex-col gap-14 md:gap-16">
				{!hasHeroHeading && <h1 className="sr-only">{title}</h1>}
				{modules?.map((module: PageModule) => (
					<PageModules key={module._key} module={module} />
				))}
				{children}
			</div>
		</PageShell>
	);
}
