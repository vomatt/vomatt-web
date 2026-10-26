import Link from 'next/link';

import { EmptyCard } from '@/components/EmptyCard';
import { T } from '@/components/T';
import { buttonVariants } from '@/components/ui/Button';

async function NotFound() {
	return (
		<div className="px-contain mx-auto w-full max-w-feed pt-8 pb-16">
			<EmptyCard
				headingLevel={1}
				title={<T k="common.notFoundTitle" />}
				body={<T k="common.notFoundBody" />}
				action={
					<Link href="/" className={buttonVariants()}>
						<T k="common.goHome" />
					</Link>
				}
			/>
		</div>
	);
}

export default NotFound;
