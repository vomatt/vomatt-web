'use client';

import { useState } from 'react';

import { PillGroup } from '@/components/PillGroup';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { X } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { UserSuggestions } from '@/features/polls/components/UserSuggestions';
import { useUserSearch } from '@/features/polls/hooks/useUserSearch';
import type { UserDto } from '@/schemas/user';

import { DEFAULT_ROLE, type OfficialRole } from './schema';

/** Picks one person by username (the search InviteePicker uses) and the role to give them. */
export function AddMemberDialog({
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
				{open && <AddMemberForm {...form} onClose={() => onOpenChange(false)} />}
			</DialogContent>
		</Dialog>
	);
}

type FormProps = {
	/** The roles the viewer may grant. */
	roles: readonly OfficialRole[];
	/** Already members, left out of the suggestions. */
	memberIds: string[];
	/** A change is being sent. */
	busy: boolean;
	/** Resolves true once added, which closes the dialog. */
	onAdd: (user: UserDto, role: OfficialRole) => Promise<boolean>;
	onClose: () => void;
};

function AddMemberForm({ roles, memberIds, busy, onAdd, onClose }: FormProps) {
	const { t } = useLanguage();
	const [query, setQuery] = useState('');
	const [picked, setPicked] = useState<UserDto | null>(null);
	const [role, setRole] = useState<OfficialRole>(DEFAULT_ROLE);
	const term = query.trim().replace(/^@/, '');
	const search = useUserSearch(picked ? '' : term, memberIds);

	const add = async () => {
		if (!picked) return;
		if (await onAdd(picked, role)) {
			onClose();
		}
	};

	return (
		<>
		<DialogHeader>
			<DialogTitle>{t('officials.addTitle')}</DialogTitle>
		</DialogHeader>
		<DialogBody className="space-y-5">
			{picked ? (
				<div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
					<UserAvatar username={picked.username} avatarUrl={picked.avatarUrl} className="size-9" />
					<span className="min-w-0 flex-1 truncate text-body-4">@{picked.username}</span>
					<Button
						variant="ghost"
						size="icon-xs"
						aria-label={t('invitees.remove', { name: picked.username })}
						onClick={() => setPicked(null)}
					>
						<X aria-hidden />
					</Button>
				</div>
			) : (
				<div className="space-y-1">
					<Input
						type="text"
						autoComplete="off"
						autoCapitalize="none"
						spellCheck={false}
						aria-label={t('officials.searchLabel')}
						placeholder={t('officials.searchPlaceholder')}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					{/* An official account can't belong to another (`official.member.invalid`): shown, but not pickable */}
					<UserSuggestions search={search} onPick={setPicked} officialNote={t('officials.officialNotAllowed')} />
				</div>
			)}
			<PillGroup
				legend={t('officials.role')}
				legendClassName="text-caption-2 font-medium text-muted-foreground"
				hint={t(`officials.roleBodies.${role}`)}
				value={role}
				onChange={setRole}
				options={roles.map((value) => ({ value, label: t(`officials.roles.${value}`) }))}
			/>
		</DialogBody>
		<DialogFooter>
			<Button size="md" variant="outline" onClick={onClose}>
				{t('common.cancel')}
			</Button>
			<Button size="md" disabled={!picked} loading={busy} onClick={add}>
				{t('officials.add')}
			</Button>
		</DialogFooter>
		</>
	);
}
