'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
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
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
import type { ActionResult } from '@/lib/api/action';
import { apiErrorText } from '@/lib/api/error-text';
import { countText } from '@/lib/count';

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
	const { t, currentLanguage } = useLanguage();
	const [groups, setGroups] = useState<Group[] | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [name, setName] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const [nameMissing, setNameMissing] = useState(false);
	const [openId, setOpenId] = useState<string | null>(null);
	// Bumped by Try again to run the load once more
	const [attempt, setAttempt] = useState(0);
	const [retrying, setRetrying] = useState(false);
	const [nameInput, focusName] = useFocusAfterRender<HTMLInputElement>();

	useEffect(() => {
		let ignore = false;
		getGroups().then((result) => {
			if (ignore) return;
			setRetrying(false);
			if (result.ok) {
				setLoadFailed(false);
				setGroups(result.data);
				// Try again unmounts with the error; the form at the top takes focus
				if (attempt > 0) focusName();
			} else {
				setLoadFailed(true);
			}
		});
		return () => {
			ignore = true;
		};
	}, [attempt, focusName]);

	// The error and its button stay up while retrying, so focus stays on the button
	const retry = () => {
		setRetrying(true);
		setAttempt((n) => n + 1);
	};

	const create = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setNameMissing(true);
			focusName();
			return;
		}
		setIsCreating(true);
		const result = await createGroup(trimmed);
		setIsCreating(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'groups.saveFailed'), { duration: Infinity });
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

			<form onSubmit={create} noValidate className="space-y-1.5">
				<div className="flex gap-2">
					<Input
						ref={nameInput}
						aria-label={t('groups.nameLabel')}
						aria-invalid={nameMissing}
						aria-describedby={nameMissing ? 'group-name-error' : undefined}
						placeholder={t('groups.namePlaceholder')}
						maxLength={GROUP_NAME_MAX}
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							setNameMissing(false);
						}}
					/>
					{/* Enabled when empty, so it stays reachable and says what's missing */}
					<Button type="submit" loading={isCreating}>
						{t('groups.create')}
					</Button>
				</div>
				{nameMissing && (
					<p id="group-name-error" className="text-xs text-destructive">
						{t('groups.nameRequired')}
					</p>
				)}
			</form>

			{groups === null && !loadFailed && (
				<div className="flex justify-center py-4">
					<Spinner />
				</div>
			)}
			{loadFailed && (
				<div className="empty-state space-y-3">
					<p>{t('groups.loadFailed')}</p>
					<Button variant="outline" size="sm" loading={retrying} onClick={retry}>
						{t('common.tryAgain')}
					</Button>
				</div>
			)}
			{groups?.length === 0 && <p className="empty-state">{t('groups.empty')}</p>}
			{!!groups?.length && (
				<ul className="space-y-2">
					{groups.map((group) => (
						<li key={group.id}>
							<button
								type="button"
								onClick={() => setOpenId(group.id)}
								className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left transition-colors hover:border-border-strong outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
							>
								<span className="min-w-0 flex-1">
									<span className="item-title block truncate">{group.name}</span>
									<span className="block text-[13px] tabular-nums text-muted-foreground">
										{countText(t, 'groups.memberCount', group.memberCount, currentLanguage)}
									</span>
								</span>
								<ArrowRight
									aria-hidden
									className="size-4 shrink-0 text-muted-foreground"
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
	const [nameEmpty, setNameEmpty] = useState(false);
	const [addEmpty, setAddEmpty] = useState(false);
	// The picker's input isn't ref-able; focus it by id once the error has rendered
	const [focusAddRequest, setFocusAddRequest] = useState(0);
	useLayoutEffect(() => {
		if (focusAddRequest) document.getElementById('add-members')?.focus();
	}, [focusAddRequest]);
	// Cancel unmounts while focused; the button that asked takes focus back
	const [deleteButton, focusDelete] = useFocusAfterRender<HTMLButtonElement>();
	const [renameInput, focusRename] = useFocusAfterRender<HTMLInputElement>();
	// Focus lands on the members list after a retry or a removal unmounts the focused button
	const [membersRegion, focusMembers] = useFocusAfterRender<HTMLDivElement>();
	// Bumped by Try again to run the load once more
	const [attempt, setAttempt] = useState(0);
	const [retrying, setRetrying] = useState(false);

	useEffect(() => {
		let ignore = false;
		getGroupMembers(group.id).then((result) => {
			if (ignore) return;
			setRetrying(false);
			if (result.ok) {
				setLoadFailed(false);
				setMembers(result.data);
				if (attempt > 0) focusMembers();
			} else {
				setLoadFailed(true);
			}
		});
		return () => {
			ignore = true;
		};
	}, [group.id, attempt, focusMembers]);

	// The error and its button stay up while retrying, so focus stays on the button
	const retryMembers = () => {
		setRetrying(true);
		setAttempt((n) => n + 1);
	};

	/** Runs one change; `key` marks what is busy. Resolves to the data, or null after a toast. */
	const run = async <T,>(key: string, request: () => Promise<ActionResult<T>>) => {
		setPending(key);
		const result = await request();
		setPending(null);
		if (result.ok) return result.data;
		toast.error(apiErrorText(t, result, 'groups.saveFailed'), { duration: Infinity });
		return null;
	};

	const showMembers = (list: GroupMember[]) => {
		setMembers(list);
		onUpdated({ ...group, memberCount: list.length });
	};

	// Rename and Add stay enabled; an empty or unchanged value is answered here, not by disabling
	const rename = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setNameEmpty(true);
			focusRename();
			return;
		}
		if (name.trim() === group.name) return;
		const updated = await run('rename', () => renameGroup(group.id, name.trim()));
		if (updated) onUpdated(updated);
	};

	const add = async () => {
		if (isSelectionEmpty(selection)) {
			setAddEmpty(true);
			setFocusAddRequest((n) => n + 1);
			return;
		}
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
		if (!list) return;
		showMembers(list);
		// The removed row's button is gone
		focusMembers();
	};

	const destroy = async () => {
		if ((await run('delete', () => deleteGroup(group.id))) !== null) onDeleted();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				closeLabel={t('common.close')}
				// The members row keeps a floor; when the rest can't fit, the popup scrolls instead of hiding it
				className="grid-rows-[auto_auto_minmax(--spacing(24),1fr)_auto_auto] sm:max-w-md"
			>
				<DialogHeader className="pr-8">
					<DialogTitle className="truncate">{group.name}</DialogTitle>
					<DialogDescription>{t('groups.dialogIntro')}</DialogDescription>
				</DialogHeader>

				<form onSubmit={rename} className="space-y-1.5">
					{/* The error goes under the row, so Rename stays level with its field */}
					<div className="flex items-end gap-2">
						<div className="flex-1 space-y-1.5">
							<Label htmlFor="group-name">{t('groups.nameLabel')}</Label>
							<Input
								ref={renameInput}
								id="group-name"
								maxLength={GROUP_NAME_MAX}
								value={name}
								aria-invalid={nameEmpty}
								aria-describedby={nameEmpty ? 'group-rename-error' : undefined}
								onChange={(e) => {
									setName(e.target.value);
									setNameEmpty(false);
								}}
							/>
						</div>
						<Button
							type="submit"
							variant="outline"
							disabled={pending !== null && pending !== 'rename'}
							loading={pending === 'rename'}
						>
							{t('groups.rename')}
						</Button>
					</div>
					{nameEmpty && (
						<p id="group-rename-error" className="text-xs text-destructive">
							{t('groups.nameRequired')}
						</p>
					)}
				</form>

				<div
					ref={membersRegion}
					tabIndex={-1}
					role="group"
					aria-label={t('groups.members')}
					className="-mx-4 overflow-y-auto overscroll-contain px-4 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
				>
					{members === null && !loadFailed && (
						<div className="flex justify-center py-4">
							<Spinner />
						</div>
					)}
					{loadFailed && (
						<div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2 text-[13px] text-muted-foreground">
							<p>{t('groups.membersFailed')}</p>
							<Button variant="outline" size="sm" loading={retrying} onClick={retryMembers}>
								{t('common.tryAgain')}
							</Button>
						</div>
					)}
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
					<InviteePicker
						id="add-members"
						value={selection}
						onChange={(next) => {
							setSelection(next);
							setAddEmpty(false);
						}}
						invalid={addEmpty}
						describedBy={addEmpty ? 'add-members-error' : undefined}
					/>
					{addEmpty && (
						<p id="add-members-error" className="text-xs text-destructive">
							{t('groups.addRequired')}
						</p>
					)}
					<div className="flex justify-end">
						<Button
							type="button"
							disabled={pending !== null && pending !== 'add'}
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
							<span id="group-delete-question" className="text-[13px]">
								{t('groups.deleteConfirm')}
							</span>
							<div className="flex gap-1.5">
								{/* Focus starts on the safe choice, which reads the question out */}
								<Button
									size="sm"
									variant="ghost"
									autoFocus
									aria-describedby="group-delete-question"
									onClick={() => {
										setConfirmingDelete(false);
										focusDelete();
									}}
								>
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
							ref={deleteButton}
							size="sm"
							variant="ghost-destructive"
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
