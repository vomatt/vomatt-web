'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidUsername, RESERVED_USERNAMES, USERNAME_MAX_LENGTH } from '@/features/account/username';
import { UpgradeButton } from '@/features/billing/UpgradeButton';
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { cn } from '@/lib/utils';

import { communityMembersHref } from './schema';
import { createCommunity } from './service';

const DISPLAY_NAME_MAX_LENGTH = 100;
const labelClassName = 'text-caption-1 font-medium text-foreground';

/**
 * Creates a community account with the signed-in user as its first owner, then takes them to its members page.
 * `atLimit` when they already own as many as their plan allows: says so instead of the form.
 */
export function CreateCommunityDialog({
	open,
	onOpenChange,
	atLimit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	atLimit?: { free: boolean };
}) {
	const { t } = useLanguage();
	const router = useRouter();
	const onCreated = (communityId: string, username: string) => {
		onOpenChange(false);
		toast.success(t('communities.created', { name: username }));
		router.push(communityMembersHref(communityId));
	};
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" closeLabel={t('common.close')}>
				{/* Unmounted on close, so reopening starts empty */}
				{atLimit ? (
					<>
						<DialogHeader>
							<DialogTitle>{t('communities.limitTitle')}</DialogTitle>
							<DialogDescription>{t(atLimit.free ? 'communities.limitBodyFree' : 'communities.limitBodyPro')}</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button type="button" size="md" variant="outline" onClick={() => onOpenChange(false)}>
								{t('common.close')}
							</Button>
							{atLimit.free && <UpgradeButton />}
						</DialogFooter>
					</>
				) : (
					open && <CreateForm onCancel={() => onOpenChange(false)} onCreated={onCreated} />
				)}
			</DialogContent>
		</Dialog>
	);
}

function CreateForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (communityId: string, username: string) => void }) {
	const { t } = useLanguage();
	const [displayName, setDisplayName] = useState('');
	const [username, setUsername] = useState('');
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [nameError, setNameError] = useState(false);
	const [failure, setFailure] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [usernameInput, focusUsername] = useFocusAfterRender<HTMLInputElement>();
	const [nameInput, focusName] = useFocusAfterRender<HTMLInputElement>();

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (busy) return;
		const name = displayName.trim();
		if (!name) {
			setNameError(true);
			focusName();
			return;
		}
		if (!isValidUsername(username)) {
			setUsernameError(
				RESERVED_USERNAMES.has(username) ? t('account.usernameReserved', { username }) : t('account.usernameInvalid')
			);
			focusUsername();
			return;
		}
		setBusy(true);
		setFailure(null);
		const result = await settle(createCommunity(username, name));
		setBusy(false);
		if (result.ok) {
			onCreated(result.data.id, result.data.username);
		} else if (result.errorCode === 'user.username.taken') {
			setUsernameError(apiErrorText(t, result));
			focusUsername();
		} else {
			setFailure(apiErrorText(t, result, 'communities.createFailed'));
		}
	};

	return (
		<form onSubmit={submit} noValidate>
			<DialogHeader>
				<DialogTitle>{t('communities.createTitle')}</DialogTitle>
				<DialogDescription>{t('communities.createIntro')}</DialogDescription>
			</DialogHeader>
			<DialogBody className="space-y-5">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="community-name" className={labelClassName}>
						{t('communities.nameLabel')}
					</label>
					<Input
						ref={nameInput}
						id="community-name"
						value={displayName}
						maxLength={DISPLAY_NAME_MAX_LENGTH}
						autoComplete="off"
						aria-invalid={nameError}
						aria-describedby={nameError ? 'community-name-error' : undefined}
						onChange={(e) => {
							setDisplayName(e.target.value);
							setNameError(false);
						}}
					/>
					{nameError && (
						<p id="community-name-error" className="text-caption-3 text-destructive">
							{t('communities.nameRequired')}
						</p>
					)}
				</div>
				<div className="flex flex-col gap-1.5">
					<label htmlFor="community-username" className={labelClassName}>
						{t('account.usernameLabel')}
					</label>
					<Input
						ref={usernameInput}
						id="community-username"
						value={username}
						maxLength={USERNAME_MAX_LENGTH}
						leading="@"
						autoComplete="off"
						autoCapitalize="none"
						spellCheck={false}
						aria-invalid={!!usernameError}
						aria-describedby="community-username-hint"
						onChange={(e) => {
							setUsername(e.target.value.trim().toLowerCase());
							setUsernameError(null);
						}}
					/>
					<p
						id="community-username-hint"
						className={cn('wrap-anywhere text-caption-3', usernameError ? 'text-destructive' : 'text-muted-foreground')}
					>
						{usernameError ?? t('communities.usernameHint')}
					</p>
				</div>
				{failure && (
					<p role="alert" className="text-caption-3 text-destructive">
						{failure}
					</p>
				)}
			</DialogBody>
			<DialogFooter>
				<Button type="button" size="md" variant="outline" onClick={onCancel}>
					{t('common.cancel')}
				</Button>
				<Button type="submit" size="md" loading={busy}>
					{t('communities.create')}
				</Button>
			</DialogFooter>
		</form>
	);
}
