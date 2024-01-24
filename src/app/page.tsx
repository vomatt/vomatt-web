import SignUp from '@/components/SignUp';
import defineMetadata from '@/lib/defineMetadata';
import { getPageHomeData } from '@/sanity/lib/fetch';

export async function generateMetadata({}) {
	const data = await getPageHomeData();
	return defineMetadata({ data });
}

export default async function Page() {
	return (
		<div className="p-home">
			<SignUp />
		</div>
	);
}
