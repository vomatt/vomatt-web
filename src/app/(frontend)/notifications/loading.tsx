import { PageShell } from '@/components/layout/PageShell';
import { NotificationsSkeleton } from '@/features/notifications/NotificationList';

export default function Loading() {
	return (
		<PageShell className="pt-4 md:pt-8">
			<div className="flex flex-col gap-5">
				<NotificationsSkeleton />
			</div>
		</PageShell>
	);
}
