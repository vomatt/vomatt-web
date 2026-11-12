'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { rowClassName } from '@/components/SettingsCard';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { cn } from '@/lib/utils';

import type { MyCommunity } from './schema';
import { deleteCommunity } from './service';

const STALE_MEMBERSHIP_CODES = ['community.role_forbidden', 'community.not_member'];

export function DeleteCommunity({ community }: { community: MyCommunity }) {
	const { t } = useLanguage();
	const router = useRouter();
	const { username } = community;
	const [open, setOpen] = useState(false);
	const [confirmation, setConfirmation] = useState('');
	const [mismatch, setMismatch] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmationInput, focusConfirmation] = useFocusAfterRender<HTMLInputElement>();

	const remove = async () => {
		if (confirmation.trim().toLowerCase() !== username.toLowerCase()) {
			setMismatch(true);
			focusConfirmation();
			return;
		}
		setIsDeleting(true);
		const result = await settle(deleteCommunity(community.communityId));
		setIsDeleting(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'communities.deleteFailed'), { duration: Infinity });
			if (result.errorCode && STALE_MEMBERSHIP_CODES.includes(result.errorCode)) {
				setOpen(false);
				router.refresh();
			}
			return;
		}
		toast.success(t('communities.deleted', { name: username }));
		router.replace('/settings#communities');
	};

	return (
		<section
			aria-labelledby="delete-community-title"
			className={cn(rowClassName, 'flex-wrap rounded-2xl border border-destructive/30 bg-card')}
		>
			<span className="min-w-0 flex-1">
				<h2 id="delete-community-title" className="font-medium text-destructive">
					{t('communities.deleteTitle')}
				</h2>
				<span className="block text-caption-1 leading-normal text-muted-foreground">{t('communities.deleteBody')}</span>
			</span>
			<Button
				variant="outline"
				size="md"
				className="border-destructive/45 text-destructive hover:text-destructive"
				onClick={() => {
					setConfirmation('');
					setMismatch(false);
					setOpen(true);
				}}
			>
				{t('communities.deleteCtaEllipsis')}
			</Button>
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('communities.deleteConfirmTitle', { name: username })}</AlertDialogTitle>
						<AlertDialogDescription className="wrap-anywhere">
							{t('communities.deleteConfirmBody', { name: username })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-1.5">
						<Input
							ref={confirmationInput}
							value={confirmation}
							onChange={(event) => {
								setConfirmation(event.target.value);
								setMismatch(false);
							}}
							aria-label={t('communities.deleteConfirmLabel')}
							aria-invalid={mismatch}
							aria-describedby={mismatch ? 'delete-community-error' : undefined}
							placeholder={username}
							autoComplete="off"
						/>
						{mismatch && (
							<p id="delete-community-error" className="wrap-anywhere text-caption-3 text-destructive">
								{t('communities.deleteConfirmMismatch', { name: username })}
							</p>
						)}
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction loading={isDeleting} onClick={remove} variant="destructive">
							{t('communities.deleteCta')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
