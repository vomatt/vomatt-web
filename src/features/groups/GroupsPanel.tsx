'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowRight } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { InviteePicker } from '@/features/polls/components/InviteePicker';
import { PeopleList } from '@/features/polls/components/PeopleList';
import { EMPTY_INVITEES, isSelectionEmpty, personKey } from '@/features/polls/invitees';
import type { ActionResult } from '@/lib/api/action';

import { type Group, GROUP_NAME_MAX,type GroupMember } from './schema';
import {
	addGroupMembers,
	createGroup,
	deleteGroup,
	getGroupMembers,
	getGroups,
	removeGroupMember,
	renameGroup,
} from './service';

/** The Account page's Groups tab: private, reusable invite lists for Invite-only Polls. */
export function GroupsPanel() {
	const { t } = useLanguage();
	const [groups, setGroups] = useState<Group[] | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [name, setName] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const [openId, setOpenId] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;
		getGroups().then((result) => {
			if (ignore) return;
			if (result.ok) setGroups(result.data);
			else setLoadFailed(true);
		});
		return () => {
			ignore = true;
		};
	}, []);

	const create = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;
		setIsCreating(true);
		const result = await createGroup(trimmed);
		setIsCreating(false);
		if (!result.ok) {
			toast.error(result.message || t('groups.saveFailed'));
			return;
		}
		setGroups((list) => [...(list ?? []), result.data].sort((a, b) => a.name.localeCompare(b.name)));
		setName('');
		setOpenId(result.data.id);
	};

	const update = (group: Group) =>
		setGroups((list) => list?.map((g) => (g.id === group.id ? group : g)) ?? null);

	const removeFromList = (id: string) => {
		setOpenId(null);
		setGroups((list) => list?.filter((g) => g.id !== id) ?? null);
	};

	const openGroup = groups?.find((group) => group.id === openId) ?? null;

	return (
		<section className="space-y-4">
			<div>
				<h2 className="font-medium">{t('groups.title')}</h2>
				<p className="text-sm text-muted-foreground">{t('groups.intro')}</p>
			</div>

			<form onSubmit={create} className="flex gap-2">
				<Input
					aria-label={t('groups.nameLabel')}
					placeholder={t('groups.namePlaceholder')}
					maxLength={GROUP_NAME_MAX}
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<Button type="submit" disabled={!name.trim()} loading={isCreating}>
					{t('groups.create')}
				</Button>
			</form>

			{groups === null && !loadFailed && (
				<div className="flex justify-center py-4">
					<Spinner />
				</div>
			)}
			{loadFailed && <p className="text-sm text-muted-foreground">{t('groups.loadFailed')}</p>}
			{groups?.length === 0 && <p className="empty-state">{t('groups.empty')}</p>}
			{!!groups?.length && (
				<ul className="space-y-2">
					{groups.map((group) => (
						<li key={group.id}>
							<button
								type="button"
								onClick={() => setOpenId(group.id)}
								className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left transition-colors hover:border-border-strong"
							>
								<span className="min-w-0 flex-1">
									<span className="item-title block truncate">{group.name}</span>
									<span className="block text-[13px] tabular-nums text-muted-foreground">
										{group.memberCount === 1
											? t('groups.memberCountOne')
											: t('groups.memberCount', { count: group.memberCount })}
									</span>
								</span>
								<ArrowRight
									aria-hidden
									className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
								/>
							</button>
						</li>
					))}
				</ul>
			)}

			{openGroup && (
				<GroupDialog
					key={openGroup.id}
					group={openGroup}
					onClose={() => setOpenId(null)}
					onUpdated={update}
					onDeleted={() => removeFromList(openGroup.id)}
				/>
			)}
		</section>
	);
}

function GroupDialog({
	group,
	onClose,
	onUpdated,
	onDeleted,
}: {
	group: Group;
	onClose: () => void;
	onUpdated: (group: Group) => void;
	onDeleted: () => void;
}) {
	const { t } = useLanguage();
	const [members, setMembers] = useState<GroupMember[] | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [name, setName] = useState(group.name);
	const [selection, setSelection] = useState(EMPTY_INVITEES);
	const [pending, setPending] = useState<string | null>(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	useEffect(() => {
		let ignore = false;
		getGroupMembers(group.id).then((result) => {
			if (ignore) return;
			if (result.ok) setMembers(result.data);
			else setLoadFailed(true);
		});
		return () => {
			ignore = true;
		};
	}, [group.id]);

	/** Runs one change; `key` marks what is busy. Resolves to the data, or null after a toast. */
	const run = async <T,>(key: string, request: () => Promise<ActionResult<T>>) => {
		setPending(key);
		const result = await request();
		setPending(null);
		if (result.ok) return result.data;
		toast.error(result.message || t('groups.saveFailed'));
		return null;
	};

	const showMembers = (list: GroupMember[]) => {
		setMembers(list);
		onUpdated({ ...group, memberCount: list.length });
	};

	const rename = async (e: React.FormEvent) => {
		e.preventDefault();
		const updated = await run('rename', () => renameGroup(group.id, name.trim()));
		if (updated) onUpdated(updated);
	};

	const add = async () => {
		const list = await run('add', () =>
			addGroupMembers(group.id, {
				userIds: selection.users.map((user) => user.id),
				emails: selection.emails,
			})
		);
		if (!list) return;
		showMembers(list);
		setSelection(EMPTY_INVITEES);
	};

	const remove = async (member: GroupMember) => {
		const list = await run(personKey(member), () => removeGroupMember(group.id, member));
		if (list) showMembers(list);
	};

	const destroy = async () => {
		if ((await run('delete', () => deleteGroup(group.id))) !== null) onDeleted();
	};

	const trimmed = name.trim();

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				closeLabel={t('common.close')}
				className="max-h-[85dvh] grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] sm:max-w-md"
			>
				<DialogHeader className="pr-8">
					<DialogTitle className="truncate">{group.name}</DialogTitle>
					<DialogDescription>{t('groups.dialogIntro')}</DialogDescription>
				</DialogHeader>

				<form onSubmit={rename} className="flex items-end gap-2">
					<div className="flex-1 space-y-1.5">
						<Label htmlFor="group-name">{t('groups.nameLabel')}</Label>
						<Input
							id="group-name"
							maxLength={GROUP_NAME_MAX}
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<Button
						type="submit"
						variant="outline"
						disabled={!trimmed || trimmed === group.name || pending !== null}
						loading={pending === 'rename'}
					>
						{t('groups.rename')}
					</Button>
				</form>

				<div className="-mx-4 overflow-y-auto px-4">
					{members === null && !loadFailed && (
						<div className="flex justify-center py-4">
							<Spinner />
						</div>
					)}
					{loadFailed && <p className="py-2 text-[13px] text-muted-foreground">{t('groups.membersFailed')}</p>}
					{members?.length === 0 && (
						<p className="py-2 text-[13px] text-muted-foreground">{t('groups.noMembers')}</p>
					)}
					{!!members?.length && (
						<PeopleList
							label={t('groups.members')}
							people={members}
							onRemove={remove}
							removingKey={pending}
							disabled={pending !== null}
						/>
					)}
				</div>

				<div className="space-y-3 border-t border-border pt-4">
					<Label htmlFor="add-members">{t('groups.addLabel')}</Label>
					<InviteePicker id="add-members" value={selection} onChange={setSelection} />
					<div className="flex justify-end">
						<Button
							type="button"
							disabled={isSelectionEmpty(selection) || pending !== null}
							loading={pending === 'add'}
							onClick={add}
						>
							{t('groups.add')}
						</Button>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
					{confirmingDelete ? (
						<>
							<span className="text-[13px]">{t('groups.deleteConfirm')}</span>
							<div className="flex gap-1.5">
								<Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
									{t('common.cancel')}
								</Button>
								<Button
									size="sm"
									variant="destructive"
									disabled={pending !== null}
									loading={pending === 'delete'}
									onClick={destroy}
								>
									{t('groups.delete')}
								</Button>
							</div>
						</>
					) : (
						<Button
							size="sm"
							variant="ghost"
							className="text-destructive"
							onClick={() => setConfirmingDelete(true)}
						>
							{t('groups.delete')}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
