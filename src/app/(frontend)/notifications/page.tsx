import { Bell } from '@/components/ui/icons';

export default function NotificationsPage() {
	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<h1 className="text-2xl font-bold mb-6">Notifications</h1>
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
				<Bell className="w-12 h-12 opacity-30" />
				<p>No notifications yet.</p>
			</div>
		</div>
	);
}
