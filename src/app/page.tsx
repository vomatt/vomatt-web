import defineMetadata from '@/lib/defineMetadata';
import { getPageHomeData } from '@/sanity/lib/fetch';

export async function generateMetadata({}) {
	const data = await getPageHomeData();
	return defineMetadata({ data });
}

export default async function Page() {
	return (
		<div className="min-h-screen px-contain">
			<h1>What’s Trending</h1>
			<ul className="flex">
				<li className="flex-1">
					<div className="w-1/4">Feed</div>
				</li>
				<li className="flex-1">
					<div className="w-1/4">Feed</div>
				</li>
				<li className="flex-1">
					<div className="w-1/4">Feed</div>
				</li>
				<li className="flex-1">
					<div className="w-1/4">Feed</div>
				</li>
				<li className="flex-1">
					<div className="w-1/4">Feed</div>
				</li>
				<li className="flex-1">
					<div className="w-1/4">Feed</div>
				</li>
			</ul>
		</div>
	);
}
