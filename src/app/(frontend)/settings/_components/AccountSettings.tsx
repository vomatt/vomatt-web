'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

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
import { Switch } from '@/components/ui/Switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { BlockedUsersPanel } from '@/features/blocks/BlockedUsersPanel';
import { isFieldPublic, VISIBILITY_FIELDS } from '@/features/account/visibility';
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
import { apiErrorText } from '@/lib/api/error-text';
import { signout } from '@/lib/api/services/auth';
import { deleteMyAccount, editProfile, updateVisibility } from '@/lib/api/services/users';
import type { MyProfile } from '@/types/user';

export default function AccountSettings({ profile }: { profile: MyProfile }) {
	const { t } = useLanguage();
	const [visibility, setVisibility] = useState<Record<string, boolean>>(profile.visibilitySettings ?? {});
	// Last values the server confirmed, per field; a failed save rolls back only its own field
	const savedVisibility = useRef(visibility);
	const [anonymousDefault, setAnonymousDefault] = useState(profile.anonymousBallotByDefault);
	// The last value the server confirmed; quick toggles can answer out of order
	const savedAnonymousDefault = useRef(profile.anonymousBallotByDefault);
	// Read out by screen readers after each save; the switch itself shows the change
	const [announcement, setAnnouncement] = useState('');

	const toggleAnonymousDefault = async (value: boolean) => {
		setAnonymousDefault(value);
		const result = await editProfile({ anonymousBallotByDefault: value });
		if (result.ok) {
			savedAnonymousDefault.current = value;
			setAnnouncement(t(value ? 'account.anonymousDefaultOn' : 'account.anonymousDefaultOff'));
		} else {
			setAnonymousDefault(savedAnonymousDefault.current);
			toast.error(apiErrorText(t, result, 'account.saveFailed'), { duration: Infinity });
		}
	};

	const toggle = async (field: string, value: boolean) => {
		setVisibility((current) => ({ ...current, [field]: value }));
		try {
			const saved = (await updateVisibility({ [field]: value }))[field] ?? value;
			savedVisibility.current = { ...savedVisibility.current, [field]: saved };
			// Only this field: other switches may have saves of their own in flight
			setVisibility((current) => ({ ...current, [field]: saved }));
			setAnnouncement(
				t(saved ? 'account.fieldVisible' : 'account.fieldHidden', { field: t(`account.field.${field}`) })
			);
		} catch {
			setVisibility((current) => ({ ...current, [field]: isFieldPublic(savedVisibility.current, field) }));
			toast.error(t('account.saveFailed'), { duration: Infinity });
		}
	};

	return (
		<div className="space-y-8">
			<p role="status" className="sr-only">
				{announcement}
			</p>
			<section className="space-y-3">
				<div>
					<h2 className="font-medium">{t('account.privacyTitle')}</h2>
					<p className="text-sm text-muted-foreground">{t('account.privacyBody')}</p>
				</div>
				<ul className="divide-y divide-border rounded-xl border border-border bg-card">
					{VISIBILITY_FIELDS.map((field) => (
						<li key={field} className="flex items-center justify-between gap-4 px-4 py-3">
							{/* The whole row is the 44px touch target; the Switch alone is smaller */}
							<label
								htmlFor={`visibility-${field}`}
								className="flex min-h-11 flex-1 cursor-pointer items-center text-sm"
							>
								{t(`account.field.${field}`)}
							</label>
							<Switch
								id={`visibility-${field}`}
								checked={isFieldPublic(visibility, field)}
								onCheckedChange={(value) => toggle(field, value)}
							/>
						</li>
					))}
				</ul>
			</section>

			<section className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
				<label htmlFor="anonymous-default" className="flex-1 cursor-pointer">
					<span id="anonymous-default-label" className="block font-medium">
						{t('account.anonymousDefault')}
					</span>
					<span id="anonymous-default-body" className="block text-sm text-muted-foreground">
						{t('account.anonymousDefaultBody')}
					</span>
				</label>
				<Switch
					id="anonymous-default"
					aria-labelledby="anonymous-default-label"
					aria-describedby="anonymous-default-body"
					checked={anonymousDefault}
					onCheckedChange={toggleAnonymousDefault}
				/>
			</section>

			<BlockedUsersPanel />

			<section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
				<div>
					<h2 className="font-medium">{t('account.signOutTitle')}</h2>
					<p className="wrap-anywhere text-sm text-muted-foreground">{profile.email}</p>
				</div>
				<Button variant="outline" onClick={() => signout()}>
					{t('account.signOut')}
				</Button>
			</section>

			<DeleteAccount username={profile.username} />
		</div>
	);
}

/** Deletion refusals with their own copy; anything else goes through apiErrorText. */
const DELETE_ERROR_KEYS: Record<string, string> = {
	'admin.last_admin': 'account.deleteLastAdmin',
};

function DeleteAccount({ username }: { username: string }) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	const [confirmation, setConfirmation] = useState('');
	const [mismatch, setMismatch] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmationInput, focusConfirmation] = useFocusAfterRender<HTMLInputElement>();

	const remove = async () => {
		// Enabled even before a match, so the button stays reachable and says what's missing
		if (confirmation.trim().toLowerCase() !== username.toLowerCase()) {
			setMismatch(true);
			focusConfirmation();
			return;
		}
		setIsDeleting(true);
		// Only returns on failure; success redirects
		const result = await deleteMyAccount();
		setIsDeleting(false);
		const key = result.errorCode && DELETE_ERROR_KEYS[result.errorCode];
		toast.error(key ? t(key) : apiErrorText(t, result, 'account.deleteFailed'), { duration: Infinity });
	};

	return (
		<section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-card p-4">
			<div>
				<h2 className="font-medium text-destructive">{t('account.deleteTitle')}</h2>
				<p className="text-sm text-muted-foreground">{t('account.deleteBody')}</p>
			</div>
			<Button variant="destructive" onClick={() => setOpen(true)}>
				{t('account.deleteCta')}
			</Button>
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('account.deleteConfirmTitle')}</AlertDialogTitle>
						<AlertDialogDescription className="wrap-anywhere">
							{t('account.deleteConfirmBody', { username })}
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
							aria-label={t('account.deleteConfirmLabel')}
							aria-invalid={mismatch}
							aria-describedby={mismatch ? 'delete-confirm-error' : undefined}
							placeholder={username}
							autoComplete="off"
						/>
						{mismatch && (
							<p id="delete-confirm-error" className="wrap-anywhere text-xs text-destructive">
								{t('account.deleteConfirmMismatch', { username })}
							</p>
						)}
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction
							loading={isDeleting}
							onClick={remove}
							variant="destructive"
						>
							{t('account.deleteCta')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
