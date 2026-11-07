import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { Skeleton } from '@/components/ui/Skeleton';

import { SettingsSubpageHeader } from '../_components/SettingsSubpageHeader';

export default function Loading() {
	return (
		<PageShell>
			<div className="flex flex-col gap-8">
				<SettingsSubpageHeader title={<T k="account.privacyTitle" />} />
				<div role="status" aria-busy className="flex flex-col gap-3">
					<span className="sr-only">
						<T k="common.loading" />
					</span>
					<Skeleton className="h-5 w-3/4" />
					<Skeleton className="h-51 rounded-2xl" />
				</div>
			</div>
		</PageShell>
	);
}
