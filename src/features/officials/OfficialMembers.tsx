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
import { formatDate } from '@/features/polls/format';
import type { ActionResult } from '@/lib/api/action';
import { apiErrorText } from '@/lib/api/error-text';
import { META_GAP } from '@/lib/rich';
import { cn } from '@/lib/utils';

import { AddMemberDialog } from './AddMemberDialog';
import { canManageMembers, grantableRoles, type MemberAction, memberActions } from './permissions';
import { RolePicker } from './RolePicker';
import { type MyOfficial, OFFICIAL_ROLES, type OfficialMember, type OfficialRole } from './schema';
import { addMember, changeRole, removeMember, transferOwner } from './service';

// The list is stale after these: someone else changed it, or the viewer's role
const REFRESH_CODES = ['official.member.not_found', 'official.role_forbidden', 'official.not_member'];

const ICONS: Record<MemberAction, React.ReactNode> = {
	changeRole: <Pencil aria-hidden />,
	transferOwner: <ArrowRight aria-hidden />,
	remove: <Trash2 aria-hidden />,
	leave: <LogOut aria-hidden />,
};

type Pending = { action: MemberAction; member: OfficialMember };

/** One row action: the request, what follows its success, the toast, and the confirm dialog's copy (none for Change role, which has its own dialog). */
type Step = {
	request: () => Promise<ActionResult<unknown>>;
	after: (data: unknown) => void;
	done: string;
	confirm?: { title: string; body: string; cta: string };
};

/** An official account's members, with what the viewer's role lets them change. */
export function OfficialMembers({
	official,
	viewerId,
	members: initialMembers,
}: {
	official: MyOfficial;
	viewerId: string;
	members: OfficialMember[];
}) {
	const { t, currentLanguage } = useLanguage();
	const router = useRouter();
	const viewer = { userId: viewerId, role: official.role };
	const officialName = official.displayName || official.username;
	const [members, setMembers] = useState(initialMembers);
	// A refresh (after a transfer, or a stale list) brings a new list from the server
	const [shown, setShown] = useState(initialMembers);
	if (shown !== initialMembers) {
		setShown(initialMembers);
		setMembers(initialMembers);
	}
	const [adding, setAdding] = useState(false);
	const [pending, setPending] = useState<Pending | null>(null);
	const [newRole, setNewRole] = useState<OfficialRole>('EDITOR');
	const [busy, setBusy] = useState(false);

	/** Runs a change; true when it went through. */
	const run = async ({ request, after, done }: Omit<Step, 'confirm'>) => {
		setBusy(true);
		const result = await request();
		setBusy(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result), { duration: Infinity });
			if (result.errorCode && REFRESH_CODES.includes(result.errorCode)) router.refresh();
			return false;
		}
		toast.success(done);
		after(result.data);
		return true;
	};

	const replaceMember = (data: unknown) => {
		const changed = data as OfficialMember;
		setMembers((list) => list.map((m) => (m.userId === changed.userId ? changed : m)));
	};

	const step = (({ action, member }: Pending): Step => {
		const id = official.officialId;
		const vars = { name: member.username, official: officialName };
		const copy = (title: string, body: string, cta: string) => ({ title: t(title, vars), body: t(body, vars), cta: t(cta) });
		return {
			changeRole: {
				request: () => changeRole(id, member.userId, newRole),
				after: replaceMember,
				done: t('officials.roleChanged', vars),
			},
			transferOwner: {
				request: () => transferOwner(id, member.userId),
				// The viewer is an ADMIN now: their menus change with the server's answer
				after: () => router.refresh(),
				done: t('officials.transferred', vars),
				confirm: copy('officials.transferTitle', 'officials.transferBody', 'officials.transfer'),
			},
			remove: {
				request: () => removeMember(id, member.userId),
				after: () => setMembers((list) => list.filter((m) => m.userId !== member.userId)),
				done: t('officials.removed', vars),
				confirm: copy('officials.removeTitle', 'officials.removeBody', 'officials.remove'),
			},
			leave: {
				request: () => removeMember(id, member.userId),
				after: () => router.replace('/settings#officials'),
				done: t('officials.left', vars),
				confirm: copy('officials.leaveTitle', 'officials.leaveBody', 'officials.leave'),
			},
		}[action];
	});
	const current = pending && step(pending);

	const confirm = async () => {
		if (!current) return;
		await run(current);
		setPending(null);
	};

	const open = (action: MemberAction, member: OfficialMember) => {
		setNewRole(member.role);
		setPending({ action, member });
	};

	return (
		<div className="space-y-8">
			<section aria-labelledby="members-title" className="space-y-2.5">
				<div className="flex items-center justify-between gap-4">
					<h2 id="members-title" className="text-title-4">
						{t('officials.members')}
					</h2>
					{canManageMembers(official.role) && (
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
											{t('officials.joined', { date: formatDate(member.joinedAt, currentLanguage) })}
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
				busy={busy}
				onAdd={(user, role) =>
					run({
						request: () => addMember(official.officialId, user.id, role),
						after: (data) => setMembers((list) => [...list, data as OfficialMember]),
						done: t('officials.added', { name: user.username }),
					})
				}
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

			<AlertDialog open={!!current?.confirm} onOpenChange={(isOpen) => !isOpen && setPending(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{current?.confirm?.title}</AlertDialogTitle>
						<AlertDialogDescription>{current?.confirm?.body}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction
							loading={busy}
							onClick={confirm}
							variant={pending?.action === 'transferOwner' ? 'default' : 'destructive'}
						>
							{current?.confirm?.cta}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
