import Link from 'next/link';

import { EmptyCard } from '@/components/EmptyCard';
import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { buttonVariants } from '@/components/ui/Button';

async function NotFound() {
	return (
		<PageShell>
			<EmptyCard
				className="max-w-feed"
				headingLevel={1}
				title={<T k="common.notFoundTitle" />}
				body={<T k="common.notFoundBody" />}
				action={
					<Link href="/" className={buttonVariants()}>
						<T k="common.goHome" />
					</Link>
				}
			/>
		</PageShell>
	);
}

export default NotFound;
