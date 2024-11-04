import { getCurrentUser } from '@/data/auth';
import defineMetadata from '@/lib/defineMetadata';
import { getPageHomeData } from '@/sanity/lib/fetch';

export async function generateMetadata({}) {
	const data = await getPageHomeData();
	return defineMetadata({ data });
}

export default async function Page() {
	const user = await getCurrentUser();
	return (
		<div className="min-h-screen px-contain text-white">
			<div className="mt-5">
				{user && <h4 className="mb-3">Hi {user.nickName}</h4>}
				<h1>What&apos;s Trending</h1>
			</div>
		</div>
	);
}
