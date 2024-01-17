import SignUp from '@/components/SignUp';
import defineMetadata from '@/lib/defineMetadata';

// export async function generateMetadata({}) {
// 	const data = await getPageData();
// 	return defineMetadata({ data });
// }

export default async function Page() {
	return (
		<div className="p-home">
			<SignUp />
		</div>
	);
}
