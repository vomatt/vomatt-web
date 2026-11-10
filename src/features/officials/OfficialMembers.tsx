'use client';

import { Menu } from '@base-ui/react/menu';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { RowMenuRoot } from '@/components/RowMenuRoot';
import { RowText, SettingsCard } from '@/components/SettingsCard';
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
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { menuItemClassName, menuPopupClassName } from '@/components/ui/menu';
import { ArrowRight, Ellipsis, LogOut, Pencil, Plus, Trash2 } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { htmlLang } from '@/i18n-config';
import type { ActionFailure, ActionResult } from '@/lib/api/action';
import { apiErrorText } from '@/lib/api/error-text';
import { META_GAP } from '@/lib/rich';
import { cn } from '@/lib/utils';

import { AddMemberDialog } from './AddMemberDialog';
import { can, grantableRoles, type MemberAction, memberActions } from './permissions';
import { RolePicker } from './RolePicker';
import { type MyOfficial, OFFICIAL_ROLES, type OfficialMember, type OfficialRole } from './schema';
import { addMember, changeRole, removeMember, transferOwner } from './service';

/** Refusals with their own copy; anything else goes through apiErrorText. */
export const MEMBER_ERROR_KEYS: Record<string, string> = {
	'official.last_owner': 'officials.errors.lastOwner',
	'official.member.exists': 'officials.errors.exists',
	'official.member.invalid': 'officials.errors.invalid',
	'official.member.not_found': 'officials.errors.notFound',
	'official.role_forbidden': 'officials.errors.forbidden',
	'official.not_member': 'officials.errors.notMember',
};

// The list is stale after these: someone else changed it, or the viewer's role
const REFRESH_CODES = ['official.member.not_found', 'official.role_forbidden', 'official.not_member'];

const ICONS: Record<MemberAction, React.ReactNode> = {
	changeRole: <Pencil aria-hidden />,
	transferOwner: <ArrowRight aria-hidden />,
	remove: <Trash2 aria-hidden />,
	leave: <LogOut aria-hidden />,
};

type Pending = { action: MemberAction; member: OfficialMember };

/** An official account's members, with what the viewer's role lets them change. */
export function OfficialMembers({
	official,
	viewerId,
	members,
}: {
	official: MyOfficial;
	viewerId: string;
	members: OfficialMember[];
}) {
	const { t, currentLanguage } = useLanguage();
	const router = useRouter();
	const viewer = { userId: viewerId, role: official.role };
	const officialName = official.displayName || official.username;
	const [adding, setAdding] = useState(false);
	const [pending, setPending] = useState<Pending | null>(null);
	const [newRole, setNewRole] = useState<OfficialRole>('EDITOR');
	const [busy, setBusy] = useState(false);
	const joined = new Intl.DateTimeFormat(htmlLang(currentLanguage), { dateStyle: 'medium' });

	const fail = (result: ActionFailure) => {
		const key = result.errorCode && MEMBER_ERROR_KEYS[result.errorCode];
		toast.error(key ? t(key) : apiErrorText(t, result), { duration: Infinity });
		if (result.errorCode && REFRESH_CODES.includes(result.errorCode)) router.refresh();
	};

	/** Runs a change; true when it went through. */
	const run = async (request: Promise<ActionResult<unknown>>, done: string) => {
		setBusy(true);
		const result = await request;
		setBusy(false);
		if (!result.ok) {
			fail(result);
			return false;
		}
		toast.success(done);
		router.refresh();
		return true;
	};

	const confirm = async () => {
		if (!pending) return;
		const { action, member } = pending;
		const name = member.username;
		const ok =
			action === 'changeRole'
				? await run(changeRole(official.officialId, member.userId, newRole), t('officials.roleChanged', { name }))
				: action === 'transferOwner'
					? await run(transferOwner(official.officialId, member.userId), t('officials.transferred', { name }))
					: await run(
							removeMember(official.officialId, member.userId),
							t(action === 'leave' ? 'officials.left' : 'officials.removed', { name, official: officialName })
						);
		setPending(null);
		if (ok && action === 'leave') router.replace('/settings#officials');
	};

	const open = (action: MemberAction, member: OfficialMember) => {
		setNewRole(member.role);
		setPending({ action, member });
	};

	const confirmCopy = pending && {
		remove: {
			title: t('officials.removeTitle', { name: pending.member.username }),
			body: t('officials.removeBody', { official: officialName }),
			cta: t('officials.remove'),
		},
		transferOwner: {
			title: t('officials.transferTitle', { name: pending.member.username }),
			body: t('officials.transferBody', { name: pending.member.username, official: officialName }),
			cta: t('officials.transfer'),
		},
		leave: {
			title: t('officials.leaveTitle', { official: officialName }),
			body: t('officials.leaveBody'),
			cta: t('officials.leave'),
		},
		changeRole: null,
	}[pending.action];

	return (
		<div className="space-y-8">
			<section aria-labelledby="members-title" className="space-y-2.5">
				<div className="flex items-center justify-between gap-4">
					<h2 id="members-title" className="text-title-4">
						{t('officials.members')}
					</h2>
					{can(official.role, 'manageMembers') && (
						<Button size="md" variant="outline" onClick={() => setAdding(true)}>
							<Plus aria-hidden />
							{t('officials.add')}
						</Button>
					)}
				</div>
				<SettingsCard as="ul">
					{members.map((member) => {
						const actions = memberActions(viewer, member);
						const isViewer = member.userId === viewerId;
						return (
							<li key={member.userId} className="flex min-h-15 items-center gap-3 px-4.5 py-3">
								<UserAvatar username={member.username} avatarUrl={member.avatarUrl} className="size-9" />
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">
										{member.displayName || member.username}
										{isViewer && <span className="text-muted-foreground"> {t('officials.you')}</span>}
									</p>
									<p className="truncate text-caption-2 text-muted-foreground">
										@{member.username}
										{META_GAP}
										{t(`officials.roles.${member.role}`)}
										{META_GAP}
										<span suppressHydrationWarning>
											{t('officials.joined', { date: joined.format(new Date(member.joinedAt)) })}
										</span>
									</p>
								</div>
								{actions.length > 0 && (
									<RowMenuRoot>
										<Menu.Trigger
											render={<Button variant="ghost" size="icon-xs" />}
											aria-label={t('officials.memberMore', { name: member.username })}
											className="data-popup-open:bg-muted"
										>
											<Ellipsis aria-hidden />
										</Menu.Trigger>
										<Menu.Portal>
											<Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
												<Menu.Popup className={menuPopupClassName}>
													{actions.map((action) => (
														<Menu.Item
															key={action}
															onClick={() => open(action, member)}
															className={cn(
																menuItemClassName,
																(action === 'remove' || action === 'leave') && 'text-destructive'
															)}
														>
															{ICONS[action]}
															{t(`officials.actions.${action}`)}
														</Menu.Item>
													))}
												</Menu.Popup>
											</Menu.Positioner>
										</Menu.Portal>
									</RowMenuRoot>
								)}
							</li>
						);
					})}
				</SettingsCard>
			</section>

			<section aria-labelledby="roles-title" className="space-y-2.5">
				<h2 id="roles-title" className="text-title-4">
					{t('officials.rolesTitle')}
				</h2>
				<SettingsCard as="ul">
					{OFFICIAL_ROLES.map((role) => (
						<li key={role} className="flex min-h-15 items-center px-4.5 py-3">
							<RowText title={t(`officials.roles.${role}`)} body={t(`officials.roleBodies.${role}`)} />
						</li>
					))}
				</SettingsCard>
			</section>

			<AddMemberDialog
				open={adding}
				onOpenChange={setAdding}
				roles={grantableRoles(official.role)}
				memberIds={members.map((member) => member.userId)}
				onAdd={(user, role) => run(addMember(official.officialId, user.id, role), t('officials.added', { name: user.username }))}
			/>

			<Dialog open={pending?.action === 'changeRole'} onOpenChange={(isOpen) => !isOpen && setPending(null)}>
				<DialogContent className="sm:max-w-lg" closeLabel={t('common.close')}>
					<DialogHeader>
						<DialogTitle>{pending && t('officials.changeRoleTitle', { name: pending.member.username })}</DialogTitle>
					</DialogHeader>
					<DialogBody>
						<RolePicker roles={grantableRoles(official.role)} value={newRole} onChange={setNewRole} />
					</DialogBody>
					<DialogFooter>
						<Button size="md" variant="outline" onClick={() => setPending(null)}>
							{t('common.cancel')}
						</Button>
						<Button size="md" loading={busy} disabled={newRole === pending?.member.role} onClick={confirm}>
							{t('common.save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!confirmCopy} onOpenChange={(isOpen) => !isOpen && setPending(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
						<AlertDialogDescription>{confirmCopy?.body}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction
							loading={busy}
							onClick={confirm}
							variant={pending?.action === 'transferOwner' ? 'default' : 'destructive'}
						>
							{confirmCopy?.cta}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
