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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight } from '@/components/ui/SvgIcons';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Insights } from '@/features/account/insights';
import { GroupsPanel } from '@/features/groups/GroupsPanel';
import type { Poll } from '@/features/polls/schema';
import type { CursorPage } from '@/lib/api/cursor';
import { apiErrorText } from '@/lib/api/error-text';
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
	polls: CursorPage<Poll>;
	insights: Insights;
};

type PublicView = {
	isOwn: false;
	profile: UserProfile;
	polls: CursorPage<Poll>;
	isAuthenticated: boolean;
};

/**
 * The owner sees the page visitors see, plus their insights, Groups and
 * Settings. Their poll lists live in My Polls, which the stat cards link to.
 */
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

	// The owner's counts open My Polls, where the lists behind them live
	const myPollsHref = props.isOwn ? '/my-polls' : undefined;

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
				<Stat label={t('account.votesCast')} value={profile.totalVotes} href={myPollsHref} />
				<Stat label={t('account.pollsCreated')} value={profile.totalPolls} href={myPollsHref} />
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
				<Tabs defaultValue="polls" className="gap-6">
					<TabsList variant="line">
						<TabsTrigger value="polls">{t('profile.polls')}</TabsTrigger>
						<TabsTrigger value="groups">{t('account.tabGroups')}</TabsTrigger>
						<TabsTrigger value="settings">{t('account.tabSettings')}</TabsTrigger>
						<TabsIndicator />
					</TabsList>
					<TabsContent value="polls">
						<ProfilePollList username={profile.username} initialPage={props.polls} />
					</TabsContent>
					<TabsContent value="groups">
						<GroupsPanel />
					</TabsContent>
					<TabsContent value="settings">
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

function Stat({
	label,
	value,
	hint,
	href,
}: {
	label: string;
	value: number | string;
	hint?: string;
	href?: string;
}) {
	const body = (
		<>
			<p className="font-mono text-[28px] leading-none tracking-tight tabular-nums">
				{typeof value === 'number' ? value.toLocaleString() : value}
			</p>
			<p className="mt-2 flex items-center gap-1 text-[13px] text-muted-foreground">
				{label}
				{/* Marks the cards that open My Polls; hover alone doesn't show on touch */}
				{href && <ArrowRight aria-hidden className="size-3.5 shrink-0" />}
			</p>
		</>
	);
	if (href) {
		return (
			<Link
				href={href}
				// Inset so the grid's overflow-hidden doesn't clip the ring
				className="block bg-card p-4 outline-none transition-colors hover:bg-muted focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
			>
				{body}
			</Link>
		);
	}
	return (
		<div className="bg-card p-4" title={hint}>
			{body}
		</div>
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
			toast.error(apiErrorText(t, result, 'account.saveFailed'));
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
					<h2 className="font-medium">{t('account.privacyTitle')}</h2>
					<p className="text-sm text-muted-foreground">{t('account.privacyBody')}</p>
				</div>
				<ul className="divide-y divide-border rounded-xl border border-border bg-card">
					{VISIBILITY_FIELDS.map((field) => (
						<li key={field} className="flex items-center justify-between gap-4 px-4 py-3">
							{/* The whole row is the 44px touch target; the Switch alone is smaller */}
							<label
								htmlFor={`visibility-${field}`}
								className="flex min-h-11 flex-1 cursor-pointer items-center text-sm"
							>
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
				<label htmlFor="anonymous-default" className="flex-1 cursor-pointer">
					<span id="anonymous-default-label" className="block font-medium">
						{t('account.anonymousDefault')}
					</span>
					<span id="anonymous-default-body" className="block text-sm text-muted-foreground">
						{t('account.anonymousDefaultBody')}
					</span>
				</label>
				<Switch
					id="anonymous-default"
					aria-labelledby="anonymous-default-label"
					aria-describedby="anonymous-default-body"
					checked={anonymousDefault}
					onCheckedChange={toggleAnonymousDefault}
				/>
			</section>

			<section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
				<div>
					<h2 className="font-medium">{t('account.signOutTitle')}</h2>
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

/** Deletion refusals with their own copy; anything else goes through apiErrorText. */
const DELETE_ERROR_KEYS: Record<string, string> = {
	'admin.last_admin': 'account.deleteLastAdmin',
};

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
		const key = result.errorCode && DELETE_ERROR_KEYS[result.errorCode];
		toast.error(key ? t(key) : apiErrorText(t, result));
	};

	return (
		<section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-card p-4">
			<div>
				<h2 className="font-medium text-destructive">{t('account.deleteTitle')}</h2>
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
							variant="destructive"
						>
							{t('account.deleteCta')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
