import { T } from '@/components/T';

async function NotFound() {
	return (
		<div className="not-found">
			<h1 className="text-lg font-bold">
				<T k="common.notFoundTitle" />
			</h1>
			<p className="text-sm">
				<T k="common.notFoundBody" />
			</p>
		</div>
	);
}

export default NotFound;
