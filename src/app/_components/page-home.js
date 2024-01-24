'use client';

import PageModules from '@/components/PageModules';

export default function PageHome({ data }) {
	const { pageModules } = data ?? {};

	return (
		pageModules &&
		pageModules?.map((module, i) => <PageModules key={i} module={module} />)
	);
}
