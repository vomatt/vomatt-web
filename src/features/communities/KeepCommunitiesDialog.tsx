'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { rowClassName, SettingsCard } from '@/components/SettingsCard';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { formatDate } from '@/features/polls/format';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { cn } from '@/lib/utils';
import type { CommunityQuota } from '@/types/user';

import { useActing } from './ActingProvider';
import { LockedChip } from './LockedChip';
import { accountName, type MyCommunity } from './schema';
import { keepCommunities } from './service';

/**
 * The user owns more community accounts than their plan allows: they choose which stay unlocked, and the rest
 * are locked. The API takes exactly min(limit, owned), so the dialog does too.
 */
export function KeepCommunitiesDialog({
	open,
	onOpenChange,
	quota,
	communities,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	quota: CommunityQuota;
	/** All the user's community accounts; only the ones they own are offered */
	communities: MyCommunity[];
}) {
	const { t } = useLanguage();
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" closeLabel={t('common.close')}>
				{/* Unmounted on close, so reopening starts with nothing chosen */}
				{open && (
					<KeepForm
						quota={quota}
						owned={communities.filter((c) => c.role === 'OWNER')}
						onCancel={() => onOpenChange(false)}
						onKept={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function KeepForm({
	quota,
	owned,
	onCancel,
	onKept,
}: {
	quota: CommunityQuota;
	owned: MyCommunity[];
	onCancel: () => void;
	onKept: () => void;
}) {
	const { t, currentLanguage } = useLanguage();
	const router = useRouter();
	const { reloadCommunities } = useActing();
	const required = Math.min(quota.limit, owned.length);
	const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
	const [busy, setBusy] = useState(false);
	const [failure, setFailure] = useState<string | null>(null);
	const full = chosen.size === required;

	const toggle = (id: string) => {
		const next = new Set(chosen);
		if (!next.delete(id)) next.add(id);
		setChosen(next);
		setFailure(null);
	};

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!full || busy) return;
		setBusy(true);
		const result = await settle(keepCommunities([...chosen]));
		setBusy(false);
		if (!result.ok) {
			setFailure(apiErrorText(t, result, 'communities.keep.failed'));
			return;
		}
		toast.success(t('communities.keep.done'));
		onKept();
		router.refresh();
		reloadCommunities();
	};

	return (
		<form onSubmit={submit}>
			<DialogHeader>
				<DialogTitle>{t('communities.keep.title')}</DialogTitle>
				<DialogDescription>
					{t('communities.keep.body', { limit: quota.limit, count: required })}
					{quota.selectionDeadline && (
						<>
							{' '}
							<span suppressHydrationWarning>
								{t('communities.keep.deadline', { date: formatDate(quota.selectionDeadline, currentLanguage) })}
							</span>
						</>
					)}
				</DialogDescription>
			</DialogHeader>
			<DialogBody className="space-y-3">
				<SettingsCard as="ul">
					{owned.map((community) => {
						const checked = chosen.has(community.communityId);
						const id = `keep-${community.communityId}`;
						return (
							<li key={community.communityId}>
								<label htmlFor={id} className={cn(rowClassName, 'cursor-pointer gap-3', !checked && full && 'cursor-default opacity-60')}>
									<input
										id={id}
										type="checkbox"
										className="size-4 shrink-0 accent-primary"
										checked={checked}
										disabled={!checked && full}
										onChange={() => toggle(community.communityId)}
									/>
									<UserAvatar username={community.username} avatarUrl={community.avatarUrl} className="size-8" />
									<span className="min-w-0 flex-1">
										<span className="block truncate font-medium">{accountName(community)}</span>
										<span className="block truncate text-caption-2 text-muted-foreground">@{community.username}</span>
									</span>
									{community.locked && <LockedChip />}
								</label>
							</li>
						);
					})}
				</SettingsCard>
				{failure && (
					<p role="alert" className="text-caption-3 text-destructive">
						{failure}
					</p>
				)}
			</DialogBody>
			<DialogFooter>
				<p className="me-auto self-center text-caption-1 text-muted-foreground tabular-nums">
					{t('communities.keep.chosen', { count: chosen.size, required })}
				</p>
				<Button type="button" size="md" variant="outline" onClick={onCancel}>
					{t('communities.keep.later')}
				</Button>
				<Button type="submit" size="md" loading={busy} disabled={!full}>
					{t('communities.keep.submit')}
				</Button>
			</DialogFooter>
		</form>
	);
}
