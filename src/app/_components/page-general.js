'use client';

import PageModules from '@/components/PageModules';

export default function PageGeneral({ data }) {
	const { pageModules: modules } = data;

	return (
		<div className="page-general c-3">
			{modules?.map((module, i) => (
				<PageModules key={i} module={module} />
			))}
		</div>
	);
}
