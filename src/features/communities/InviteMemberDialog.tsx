'use client';

import { useId, useState } from 'react';

import { emailSchema } from '@/components/auth/auth-schemas';
import { PillGroup } from '@/components/PillGroup';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { FieldMessage } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Plus, X } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { keepFieldFocused, UserSuggestions } from '@/features/polls/components/UserSuggestions';
import { useUserSearch } from '@/features/polls/hooks/useUserSearch';
import { cn } from '@/lib/utils';
import type { UserDto } from '@/schemas/user';

import { type CommunityRole,DEFAULT_ROLE } from './schema';

/** Picks one person by username (the search InviteePicker uses) or an email address, and the role to offer them. */
export function InviteMemberDialog({
	open,
	onOpenChange,
	...form
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
} & Omit<FormProps, 'onClose'>) {
	const { t } = useLanguage();
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" closeLabel={t('common.close')}>
				{/* Unmounted on close, so reopening starts empty */}
				{open && <InviteMemberForm {...form} onClose={() => onOpenChange(false)} />}
			</DialogContent>
		</Dialog>
	);
}

export type Invitee = { user: UserDto } | { email: string };

export type InviteError = { text: string; code?: string };

// The server's answer about who was picked: inviting them again, with any role, gets it again
const INVITEE_CODES = [
	'community.invitation.exists',
	'community.member.exists',
	'community.member.invalid',
	'community.invitee_not_allowed',
];

type FormProps = {
	/** The roles the viewer may grant. */
	roles: readonly CommunityRole[];
	/** Already members, left out of the suggestions. */
	excludeIds: string[];
	/** A change is being sent. */
	busy: boolean;
	/** Resolves null once invited, which closes the dialog, or with the error to show under the invitee. */
	onInvite: (invitee: Invitee, role: CommunityRole) => Promise<InviteError | null>;
	onClose: () => void;
};

function InviteMemberForm({ roles, excludeIds, busy, onInvite, onClose }: FormProps) {
	const { t } = useLanguage();
	const [query, setQuery] = useState('');
	const [picked, setPicked] = useState<Invitee | null>(null);
	// Goes with the picked invitee: picking another clears it
	const [error, setError] = useState<InviteError | null>(null);
	const aboutInvitee = !!error?.code && INVITEE_CODES.includes(error.code);
	const errorId = useId();
	const [role, setRole] = useState<CommunityRole>(DEFAULT_ROLE);
	const term = query.trim().replace(/^@/, '');
	// An address is invited as typed; anything else is searched as a username
	const email = term.toLowerCase();
	const isEmail = emailSchema.shape.email.safeParse(email).success;
	const search = useUserSearch(picked || term.includes('@') ? '' : term, excludeIds);

	const pickedName = !picked ? '' : ('user' in picked ? `@${picked.user.username}` : picked.email);

	const pick = (next: Invitee | null) => {
		setPicked(next);
		setError(null);
	};

	const invite = async () => {
		if (!picked) return;
		const failed = await onInvite(picked, role);
		if (failed) setError(failed);
		else onClose();
	};

	return (
		<>
		<DialogHeader>
			<DialogTitle>{t('communities.inviteTitle')}</DialogTitle>
		</DialogHeader>
		<DialogBody className="space-y-5">
			{picked ? (
				<div className="space-y-2">
					<div
						className={cn(
							'flex items-center gap-3 rounded-xl border border-border px-3 py-2 transition-colors',
							aboutInvitee && 'border-destructive'
						)}
					>
						{'user' in picked && <UserAvatar username={picked.user.username} avatarUrl={picked.user.avatarUrl} className="size-9" />}
						<span className="min-w-0 flex-1 truncate text-body-4">{pickedName}</span>
						<Button
							variant="ghost"
							size="icon-xs"
							aria-label={t('invitees.remove', { name: pickedName })}
							onClick={() => pick(null)}
						>
							<X aria-hidden />
						</Button>
					</div>
					{/* The error takes the hint's line, so it appears without moving the role choice */}
					<FieldMessage
						className="text-caption-2 text-muted-foreground"
						hint={t('user' in picked ? 'communities.inviteUserHint' : 'communities.inviteEmailHint')}
						errors={error ? [{ id: errorId, text: error.text }] : []}
					/>
				</div>
			) : (
				<div className="space-y-2">
					<Input
						type="text"
						autoComplete="off"
						autoCapitalize="none"
						spellCheck={false}
						aria-label={t('communities.searchLabel')}
						placeholder={t('communities.searchPlaceholder')}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<div className="rounded-xl border border-border p-1 empty:hidden">
						{isEmail && (
							<button
								type="button"
								onMouseDown={keepFieldFocused}
								onClick={() => pick({ email })}
								className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-body-4 hover:bg-muted"
							>
								<span aria-hidden className="avatar-frame grid place-items-center bg-muted text-muted-foreground">
									<Plus className="size-4" />
								</span>
								<span className="min-w-0 flex-1 truncate">{t('communities.inviteEmail', { email })}</span>
							</button>
						)}
						{/* A community account can't belong to another (`community.member.invalid`): shown, but not pickable */}
						<UserSuggestions search={search} onPick={(user) => pick({ user })} communityNote={t('communities.communityNotAllowed')} />
					</div>
				</div>
			)}
			<PillGroup
				legend={t('communities.role')}
				legendClassName="text-caption-2 font-medium text-muted-foreground"
				hint={t(`communities.roleBodies.${role}`)}
				value={role}
				onChange={(next) => {
					setRole(next);
					// Another role may go through; who was picked stays the problem whatever the role
					if (!aboutInvitee) setError(null);
				}}
				options={roles.map((value) => ({ value, label: t(`communities.roles.${value}`) }))}
			/>
		</DialogBody>
		<DialogFooter>
			<Button size="md" variant="outline" onClick={onClose}>
				{t('common.cancel')}
			</Button>
			<Button size="md" disabled={!picked || aboutInvitee} loading={busy} aria-describedby={error ? errorId : undefined} onClick={invite}>
				{t('communities.invite')}
			</Button>
		</DialogFooter>
		</>
	);
}
