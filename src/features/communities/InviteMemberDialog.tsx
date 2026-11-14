'use client';

import { useState } from 'react';

import { emailSchema } from '@/components/auth/auth-schemas';
import { PillGroup } from '@/components/PillGroup';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Plus, X } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { keepFieldFocused, UserSuggestions } from '@/features/polls/components/UserSuggestions';
import { useUserSearch } from '@/features/polls/hooks/useUserSearch';
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

type FormProps = {
	/** The roles the viewer may grant. */
	roles: readonly CommunityRole[];
	/** Already members, left out of the suggestions. */
	excludeIds: string[];
	/** A change is being sent. */
	busy: boolean;
	/** Resolves true once invited, which closes the dialog. */
	onInvite: (invitee: Invitee, role: CommunityRole) => Promise<boolean>;
	onClose: () => void;
};

function InviteMemberForm({ roles, excludeIds, busy, onInvite, onClose }: FormProps) {
	const { t } = useLanguage();
	const [query, setQuery] = useState('');
	const [picked, setPicked] = useState<Invitee | null>(null);
	const [role, setRole] = useState<CommunityRole>(DEFAULT_ROLE);
	const term = query.trim().replace(/^@/, '');
	// An address is invited as typed; anything else is searched as a username
	const email = term.toLowerCase();
	const isEmail = emailSchema.shape.email.safeParse(email).success;
	const search = useUserSearch(picked || term.includes('@') ? '' : term, excludeIds);

	const pickedName = !picked ? '' : ('user' in picked ? `@${picked.user.username}` : picked.email);

	const invite = async () => {
		if (!picked) return;
		if (await onInvite(picked, role)) {
			onClose();
		}
	};

	return (
		<>
		<DialogHeader>
			<DialogTitle>{t('communities.inviteTitle')}</DialogTitle>
		</DialogHeader>
		<DialogBody className="space-y-5">
			{picked ? (
				<div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
					{'user' in picked && <UserAvatar username={picked.user.username} avatarUrl={picked.user.avatarUrl} className="size-9" />}
					<span className="min-w-0 flex-1 truncate text-body-4">{pickedName}</span>
					<Button
						variant="ghost"
						size="icon-xs"
						aria-label={t('invitees.remove', { name: pickedName })}
						onClick={() => setPicked(null)}
					>
						<X aria-hidden />
					</Button>
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
								onClick={() => setPicked({ email })}
								className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-body-4 hover:bg-muted"
							>
								<span aria-hidden className="avatar-frame grid place-items-center bg-muted text-muted-foreground">
									<Plus className="size-4" />
								</span>
								<span className="min-w-0 flex-1 truncate">{t('communities.inviteEmail', { email })}</span>
							</button>
						)}
						{/* A community account can't belong to another (`community.member.invalid`): shown, but not pickable */}
						<UserSuggestions search={search} onPick={(user) => setPicked({ user })} communityNote={t('communities.communityNotAllowed')} />
					</div>
				</div>
			)}
			{picked && 'email' in picked && <p className="text-caption-2 text-muted-foreground">{t('communities.inviteEmailHint')}</p>}
			<PillGroup
				legend={t('communities.role')}
				legendClassName="text-caption-2 font-medium text-muted-foreground"
				hint={t(`communities.roleBodies.${role}`)}
				value={role}
				onChange={setRole}
				options={roles.map((value) => ({ value, label: t(`communities.roles.${value}`) }))}
			/>
		</DialogBody>
		<DialogFooter>
			<Button size="md" variant="outline" onClick={onClose}>
				{t('common.cancel')}
			</Button>
			<Button size="md" disabled={!picked} loading={busy} onClick={invite}>
				{t('communities.invite')}
			</Button>
		</DialogFooter>
		</>
	);
}
