import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyCard } from '@/components/EmptyCard';
import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { buttonVariants } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Not found' };

export default function PollNotFound() {
	return (
		<PageShell>
			<EmptyCard
				className="w-full max-w-[640px]"
				headingLevel={1}
				title={<T k="pollDetail.notFound" />}
				body={<T k="pollDetail.notFoundBody" />}
				action={
					<Link href="/explore" className={buttonVariants({ variant: 'outline' })}>
						<T k="pollDetail.notFoundExplore" />
					</Link>
				}
			/>
		</PageShell>
	);
}
