'use client';

import { Menu } from '@base-ui/react/menu';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { PillGroup } from '@/components/PillGroup';
import { RowMenuRoot } from '@/components/RowMenuRoot';
import { rowClassName, RowText, SettingsCard } from '@/components/SettingsCard';
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
import { settle } from '@/lib/api/settle';
import { META_GAP } from '@/lib/rich';
import { cn } from '@/lib/utils';

import { AddMemberDialog } from './AddMemberDialog';
import { LockedChip } from './LockedChip';
import { canManageMembers, grantableRoles, type MemberAction, memberActions } from './permissions';
import { COMMUNITY_ROLES, type CommunityMember, type CommunityRole,DEFAULT_ROLE, type MyCommunity, OFFERED_ROLES } from './schema';
import { addMember, changeRole, removeMember, transferOwner } from './service';

// The list is stale after these: someone else changed it, or the viewer's role
const REFRESH_CODES = ['community.member.not_found', 'community.role_forbidden', 'community.not_member'];

const ICONS: Record<MemberAction, React.ReactNode> = {
	changeRole: <Pencil aria-hidden />,
	transferOwner: <ArrowRight aria-hidden />,
	remove: <Trash2 aria-hidden />,
	leave: <LogOut aria-hidden />,
};

type Pending = { action: MemberAction; member: CommunityMember };

/** One row action: the request, what follows its success, the toast, and the confirm dialog's copy (none for Change role, which has its own dialog). */
type Step<T = unknown> = {
	request: () => Promise<ActionResult<T>>;
	// A method, so a step over one data type still fits `Step`
	after(data: T): void;
	done: string;
	confirm?: { title: string; body: string; cta: string };
};

/** A community account's members, with what the viewer's role lets them change. */
export function CommunityMembers({
	community,
	viewerId,
	members: initialMembers,
}: {
	community: MyCommunity;
	viewerId: string;
	members: CommunityMember[];
}) {
	const { t, currentLanguage } = useLanguage();
	const router = useRouter();
	const viewer = { userId: viewerId, role: community.role };
	const communityName = community.displayName || community.username;
	const [members, setMembers] = useState(initialMembers);
	// A refresh (after a transfer, or a stale list) brings a new list from the server
	const [shown, setShown] = useState(initialMembers);
	if (shown !== initialMembers) {
		setShown(initialMembers);
		setMembers(initialMembers);
	}
	const [adding, setAdding] = useState(false);
	const [pending, setPending] = useState<Pending | null>(null);
	const [newRole, setNewRole] = useState<CommunityRole>(DEFAULT_ROLE);
	// Analyst isn't offered yet, but a member who already has it still sees it explained and kept as a choice
	const shownRoles = members.some((m) => m.role === 'ANALYST') ? COMMUNITY_ROLES : OFFERED_ROLES;
	const grantable = grantableRoles(community.role);
	const roleChoices = pending && !grantable.includes(pending.member.role) ? [...grantable, pending.member.role] : grantable;
	const [busy, setBusy] = useState(false);

	/** Runs a change; true when it went through. */
	const run = async <T,>({ request, after, done }: Omit<Step<T>, 'confirm'>) => {
		setBusy(true);
		const result = await settle(request());
		setBusy(false);
		if (!result.ok) {
			// Every limit this page can hit is the other member's: they'd become an owner
			const text = result.errorCode === 'community.limit_reached' ? t('communities.theirLimitReached') : apiErrorText(t, result);
			toast.error(text, { duration: Infinity });
			if (result.errorCode && REFRESH_CODES.includes(result.errorCode)) router.refresh();
			return false;
		}
		toast.success(done);
		after(result.data);
		return true;
	};

	const replaceMember = (changed: CommunityMember) =>
		setMembers((list) => list.map((m) => (m.userId === changed.userId ? changed : m)));

	const step = ({ action, member }: Pending): Step => {
		const id = community.communityId;
		const vars = { name: member.username, community: communityName };
		const copy = (title: string, body: string, cta: string) => ({ title: t(title, vars), body: t(body, vars), cta: t(cta) });
		return {
			changeRole: {
				request: () => changeRole(id, member.userId, newRole),
				after: replaceMember,
				done: t('communities.roleChanged', vars),
			},
			transferOwner: {
				request: () => transferOwner(id, member.userId),
				// The viewer is an ADMIN now: their menus change with the server's answer
				after: () => router.refresh(),
				done: t('communities.transferred', vars),
				confirm: copy('communities.transferTitle', 'communities.transferBody', 'communities.transfer'),
			},
			remove: {
				request: () => removeMember(id, member.userId),
				after: () => setMembers((list) => list.filter((m) => m.userId !== member.userId)),
				done: t('communities.removed', vars),
				confirm: copy('communities.removeTitle', 'communities.removeBody', 'communities.remove'),
			},
			leave: {
				request: () => removeMember(id, member.userId),
				after: () => router.replace('/settings#communities'),
				done: t('communities.left', vars),
				confirm: copy('communities.leaveTitle', 'communities.leaveBody', 'communities.leave'),
			},
		}[action];
	};
	const current = pending && step(pending);

	const confirm = async () => {
		if (!current) return;
		await run(current);
		setPending(null);
	};

	const open = (action: MemberAction, member: CommunityMember) => {
		setNewRole(member.role);
		setPending({ action, member });
	};

	return (
		<div className="space-y-8">
			{community.locked && (
				<SettingsCard>
					<div className={cn(rowClassName, 'flex-wrap')}>
						<RowText title={<LockedChip />} body={t('communities.lockedBody')} />
					</div>
				</SettingsCard>
			)}
			<section aria-labelledby="members-title" className="space-y-2.5">
				<div className="flex items-center justify-between gap-4">
					<h2 id="members-title" className="text-title-4">
						{t('communities.members')}
					</h2>
					{canManageMembers(community.role) && !community.locked && (
						<Button size="md" variant="outline" onClick={() => setAdding(true)}>
							<Plus aria-hidden />
							{t('communities.add')}
						</Button>
					)}
				</div>
				<SettingsCard as="ul">
					{members.map((member) => {
						const actions = memberActions(viewer, member, community.locked);
						const isViewer = member.userId === viewerId;
						return (
							<li key={member.userId} className={cn(rowClassName, 'gap-3')}>
								<UserAvatar username={member.username} avatarUrl={member.avatarUrl} className="size-9" />
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">
										{member.displayName || member.username}
										{isViewer && <span className="text-muted-foreground"> {t('communities.you')}</span>}
									</p>
									<p className="truncate text-caption-2 text-muted-foreground">
										@{member.username}
										{META_GAP}
										{t(`communities.roles.${member.role}`)}
										{META_GAP}
										<span suppressHydrationWarning>
											{t('communities.joined', { date: formatDate(member.joinedAt, currentLanguage) })}
										</span>
									</p>
								</div>
								{actions.length > 0 && (
									<RowMenuRoot>
										<Menu.Trigger
											render={<Button variant="ghost" size="icon-xs" />}
											aria-label={t('communities.memberMore', { name: member.username })}
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
															{t(`communities.actions.${action}`)}
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
					{t('communities.rolesTitle')}
				</h2>
				<SettingsCard as="ul">
					{shownRoles.map((role) => (
						<li key={role} className={rowClassName}>
							<RowText title={t(`communities.roles.${role}`)} body={t(`communities.roleBodies.${role}`)} />
						</li>
					))}
				</SettingsCard>
			</section>

			<AddMemberDialog
				open={adding}
				onOpenChange={setAdding}
				roles={grantableRoles(community.role)}
				memberIds={members.map((member) => member.userId)}
				busy={busy}
				onAdd={(user, role) =>
					run({
						request: () => addMember(community.communityId, user.id, role),
						after: (added) => setMembers((list) => [...list, added]),
						done: t('communities.added', { name: user.username }),
					})
				}
			/>

			<Dialog open={pending?.action === 'changeRole'} onOpenChange={(isOpen) => !isOpen && setPending(null)}>
				<DialogContent className="sm:max-w-lg" closeLabel={t('common.close')}>
					<DialogHeader>
						<DialogTitle>{pending && t('communities.changeRoleTitle', { name: pending.member.username })}</DialogTitle>
					</DialogHeader>
					<DialogBody>
						<PillGroup
							legend={t('communities.role')}
							legendClassName="text-caption-2 font-medium text-muted-foreground"
							hint={t(`communities.roleBodies.${newRole}`)}
							value={newRole}
							onChange={setNewRole}
							options={roleChoices.map((value) => ({ value, label: t(`communities.roles.${value}`) }))}
						/>
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
