import Link from 'next/link';

import { Module } from '@/components/modules';
import getMetaData from '@/lib/getMetaData';
import { getHomePageData } from '@/sanity/lib/fetch';

const homePageData = await getHomePageData();
export const metadata = getMetaData({ data: homePageData });

export default async function Page() {
	const { page } = homePageData || {};

	if (!page) {
		return (
			<Link href="/sanity/desk/settings;general" target="_blank">
				Click to set Hompage
			</Link>
		);
	}

	return (
		<>
			{page.modules?.map((module: any, key: number) => (
				<Module key={key} index={key} module={module} />
			))}
		</>
	);
}
