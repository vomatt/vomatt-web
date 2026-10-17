'use client';

import Link from 'next/link';
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
import { Button, buttonVariants } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BallotRecord, Insights } from '@/features/account/insights';
import { GroupsPanel } from '@/features/groups/GroupsPanel';
import { chipClassName } from '@/features/polls/chip';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { StatusChip } from '@/features/polls/components/StatusChip';
import type { Poll } from '@/features/polls/schema';
import { derivePollStatus, getTurnout } from '@/features/polls/status';
import type { CursorPage } from '@/lib/api/cursor';
import { signout } from '@/lib/api/services/auth';
import { deleteMyAccount, editProfile, updateVisibility } from '@/lib/api/services/users';
import { cn } from '@/lib/utils';
import type { MyProfile, UserProfile } from '@/types/user';

import EditProfileDialog from './EditProfileDialog';
import ProfileHeader, { FollowControls } from './ProfileHeader';
import ProfilePollList from './ProfilePollList';

type OwnView = {
	isOwn: true;
	profile: MyProfile;
	myPolls: Poll[];
	history: BallotRecord[];
	insights: Insights;
};

type PublicView = {
	isOwn: false;
	profile: UserProfile;
	polls: CursorPage<Poll>;
	isAuthenticated: boolean;
};

/** The owner sees everything; visitors see the same page minus private tabs and hidden fields. */
export type AccountPageProps = OwnView | PublicView;

/** Profile fields other people can see, in the order shown. */
const VISIBILITY_FIELDS = ['displayName', 'bio', 'location', 'points', 'membershipLevel'] as const;

/** Hidden unless the owner turns them on; the owner's header leaves them out while hidden, as visitors see it. */
const HIDDEN_BY_DEFAULT = ['location', 'points', 'membershipLevel'] as const;

export default function AccountPage(props: AccountPageProps) {
	const { t } = useLanguage();
	const { profile } = props;
	// Lives here so the header follows the switches in Settings
	const [visibility, setVisibility] = useState(props.isOwn ? (props.profile.visibilitySettings ?? {}) : {});

	const headerProfile = props.isOwn
		? {
				...profile,
				...Object.fromEntries(
					HIDDEN_BY_DEFAULT.filter((field) => !visibility[field]).map((field) => [field, null])
				),
			}
		: profile;

	return (
		<div className="px-contain mx-auto max-w-3xl space-y-8 py-6 md:py-10">
			<ProfileHeader
				profile={headerProfile}
				isOwn={props.isOwn}
				action={
					props.isOwn ? (
						<EditProfileDialog
							initialUsername={profile.username}
							initialDisplayName={profile.displayName ?? ''}
							initialBio={profile.bio ?? ''}
						/>
					) : (
						<FollowControls profile={props.profile} isAuthenticated={props.isAuthenticated} />
					)
				}
			/>

			<section
				aria-label={t(props.isOwn ? 'account.stats' : 'profile.stats')}
				className={cn(
					'grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border',
					props.isOwn && 'sm:grid-cols-4'
				)}
			>
				<Stat label={t('account.votesCast')} value={profile.totalVotes} />
				<Stat label={t('account.pollsCreated')} value={profile.totalPolls} />
				{props.isOwn && (
					<>
						<Stat label={t('account.peopleReached')} value={props.insights.peopleReached} />
						<Stat
							label={t('account.majorityRate')}
							value={
								props.insights.majorityRate === null
									? t('account.majorityNone')
									: `${props.insights.majorityRate}%`
							}
							hint={t('account.majorityHint')}
						/>
					</>
				)}
			</section>

			{props.isOwn ? (
				<Tabs defaultValue="activity">
					<TabsList variant="line">
						<TabsTrigger value="activity">
							{t('account.tabActivity')}
							{props.insights.awaitingResults > 0 && (
								<span className="ml-1.5 rounded-full bg-volt px-1.5 font-mono text-[11px] text-foreground ring-1 ring-foreground/30">
									{props.insights.awaitingResults}
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger value="polls">{t('account.tabPolls')}</TabsTrigger>
						<TabsTrigger value="groups">{t('account.tabGroups')}</TabsTrigger>
						<TabsTrigger value="settings">{t('account.tabSettings')}</TabsTrigger>
						<TabsIndicator />
					</TabsList>
					<TabsContent value="activity" className="pt-4">
						<Activity history={props.history} />
					</TabsContent>
					<TabsContent value="polls" className="pt-4">
						<MyPolls polls={props.myPolls} />
					</TabsContent>
					<TabsContent value="groups" className="pt-4">
						<GroupsPanel />
					</TabsContent>
					<TabsContent value="settings" className="pt-4">
						<Settings profile={props.profile} visibility={visibility} setVisibility={setVisibility} />
					</TabsContent>
				</Tabs>
			) : (
				<section className="space-y-4">
					<h2 className="font-medium">{t('profile.polls')}</h2>
					<ProfilePollList username={profile.username} initialPage={props.polls} />
				</section>
			)}
		</div>
	);
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
	return (
		<div className="bg-card p-4" title={hint}>
			<p className="font-mono text-[28px] leading-none tracking-tight tabular-nums">
				{typeof value === 'number' ? value.toLocaleString() : value}
			</p>
			<p className="mt-2 text-[13px] text-muted-foreground">{label}</p>
		</div>
	);
}

const OUTCOME_STYLES = {
	pending: 'bg-status-scheduled',
	won: 'bg-status-open',
	tied: 'bg-status-closing',
	lost: 'bg-secondary',
	unknown: 'bg-secondary',
} as const;

function Activity({ history }: { history: BallotRecord[] }) {
	const { t } = useLanguage();
	if (history.length === 0) {
		return (
			<div className="empty-state">
				<p className="mb-4">{t('account.noVotes')}</p>
				<Link href="/" className={buttonVariants()}>
					{t('account.findPolls')}
				</Link>
			</div>
		);
	}
	return (
		<ul className="space-y-2">
			{history.map(({ poll, choice, outcome }) => (
				<PollListItem
					key={poll.id}
					poll={poll}
					meta={
						<>
							{t('account.youChose')} <strong className="font-medium text-foreground">{choice}</strong>
						</>
					}
					aside={
						<span
							className={cn(chipClassName, OUTCOME_STYLES[outcome])}
						>
							{t(`account.outcome.${outcome}`)}
						</span>
					}
				/>
			))}
		</ul>
	);
}

function MyPolls({ polls }: { polls: Poll[] }) {
	const { t } = useLanguage();
	if (polls.length === 0) {
		return (
			<p className="empty-state">
				{t('account.noPolls')}
			</p>
		);
	}
	return (
		<ul className="space-y-2">
			{polls.map((poll) => (
				<PollListItem
					key={poll.id}
					poll={poll}
					meta={t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() })}
					aside={<StatusChip status={derivePollStatus(poll)} poll={poll} />}
				/>
			))}
		</ul>
	);
}

function Settings({
	profile,
	visibility,
	setVisibility,
}: {
	profile: MyProfile;
	visibility: Record<string, boolean>;
	setVisibility: (visibility: Record<string, boolean>) => void;
}) {
	const { t } = useLanguage();
	const [anonymousDefault, setAnonymousDefault] = useState(profile.anonymousBallotByDefault);
	// The last value the server confirmed; quick toggles can answer out of order
	const savedAnonymousDefault = useRef(profile.anonymousBallotByDefault);

	const toggleAnonymousDefault = async (value: boolean) => {
		setAnonymousDefault(value);
		const result = await editProfile({ anonymousBallotByDefault: value });
		if (result.ok) {
			savedAnonymousDefault.current = value;
		} else {
			setAnonymousDefault(savedAnonymousDefault.current);
			toast.error(result.message || t('account.saveFailed'));
		}
	};

	const toggle = async (field: string, value: boolean) => {
		const previous = visibility;
		setVisibility({ ...visibility, [field]: value });
		try {
			setVisibility(await updateVisibility({ [field]: value }));
		} catch {
			setVisibility(previous);
			toast.error(t('account.saveFailed'));
		}
	};

	return (
		<div className="space-y-8">
			<section className="space-y-3">
				<div>
					<h3 className="font-medium">{t('account.privacyTitle')}</h3>
					<p className="text-sm text-muted-foreground">{t('account.privacyBody')}</p>
				</div>
				<ul className="divide-y divide-border rounded-xl border border-border bg-card">
					{VISIBILITY_FIELDS.map((field) => (
						<li key={field} className="flex items-center justify-between gap-4 px-4 py-3">
							<label htmlFor={`visibility-${field}`} className="text-sm">
								{t(`account.field.${field}`)}
							</label>
							<Switch
								id={`visibility-${field}`}
								checked={!!visibility[field]}
								onCheckedChange={(value) => toggle(field, value)}
							/>
						</li>
					))}
				</ul>
			</section>

			<section className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
				<div>
					<label htmlFor="anonymous-default" className="font-medium">
						{t('account.anonymousDefault')}
					</label>
					<p className="text-sm text-muted-foreground">{t('account.anonymousDefaultBody')}</p>
				</div>
				<Switch
					id="anonymous-default"
					checked={anonymousDefault}
					onCheckedChange={toggleAnonymousDefault}
				/>
			</section>

			<section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
				<div>
					<h3 className="font-medium">{t('account.signOutTitle')}</h3>
					<p className="text-sm text-muted-foreground">{profile.email}</p>
				</div>
				<Button variant="outline" onClick={() => signout()}>
					{t('account.signOut')}
				</Button>
			</section>

			<DeleteAccount username={profile.username} />
		</div>
	);
}

function DeleteAccount({ username }: { username: string }) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	const [confirmation, setConfirmation] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);

	const remove = async () => {
		setIsDeleting(true);
		// Only returns on failure; success redirects
		const result = await deleteMyAccount();
		setIsDeleting(false);
		if (result) toast.error(result.message);
	};

	return (
		<section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-card p-4">
			<div>
				<h3 className="font-medium text-destructive">{t('account.deleteTitle')}</h3>
				<p className="text-sm text-muted-foreground">{t('account.deleteBody')}</p>
			</div>
			<Button variant="destructive" onClick={() => setOpen(true)}>
				{t('account.deleteCta')}
			</Button>
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('account.deleteConfirmTitle')}</AlertDialogTitle>
						<AlertDialogDescription>{t('account.deleteConfirmBody', { username })}</AlertDialogDescription>
					</AlertDialogHeader>
					<Input
						value={confirmation}
						onChange={(event) => setConfirmation(event.target.value)}
						aria-label={t('account.deleteConfirmLabel')}
						placeholder={username}
						autoComplete="off"
					/>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction
							disabled={confirmation !== username || isDeleting}
							onClick={remove}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{t('account.deleteCta')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
