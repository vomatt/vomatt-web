'use client';

import PageModules from '@/components/PageModules';

export default function PageGeneral({ data }: { data: any }) {
	const { pageModules: modules } = data;

	return (
		<div className="page-general">
			{modules?.map((module: any, i: number) => (
				<PageModules key={i} module={module} />
			))}
		</div>
	);
}
