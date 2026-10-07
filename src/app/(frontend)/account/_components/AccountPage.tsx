'use client';

import Link from 'next/link';
import { useState } from 'react';
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
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BadgeId, BallotRecord, Insights } from '@/features/account/insights';
import { StatusChip } from '@/features/polls/components/StatusChip';
import type { Poll } from '@/features/polls/schema';
import { derivePollStatus, getTurnout } from '@/features/polls/status';
import { useHydrated } from '@/hooks/useHydrated';
import { signout } from '@/lib/api/services/auth';
import { deleteMyAccount, updateVisibility } from '@/lib/api/services/users';
import { cn } from '@/lib/utils';
import type { MyProfile } from '@/types/user';

import EditProfileSheet from '../../profile/[username]/_components/EditProfileSheet';

export type AccountPageProps = {
	profile: MyProfile;
	myPolls: Poll[];
	history: BallotRecord[];
	insights: Insights;
};

const BADGE_ICONS: Record<BadgeId, string> = {
	firstBallot: '🗳️',
	regular: '📅',
	pillar: '🏛️',
	questionAsker: '❓',
	crowdGatherer: '📣',
	trendReader: '🧭',
	contrarian: '🦉',
};

/** Profile fields other people can see, in the order shown. */
const VISIBILITY_FIELDS = ['displayName', 'bio', 'location', 'points', 'membershipLevel'] as const;

export default function AccountPage({ profile, myPolls, history, insights }: AccountPageProps) {
	const { t } = useLanguage();
	const name = profile.displayName || profile.username;

	return (
		<div className="px-contain mx-auto max-w-3xl space-y-6 py-6">
			<header className="flex flex-wrap items-center gap-4">
				<div
					aria-hidden
					className="grid size-16 place-items-center rounded-full bg-primary text-2xl font-semibold uppercase text-primary-foreground"
				>
					{name.slice(0, 1)}
				</div>
				<div className="min-w-0 flex-1">
					<h1 className="truncate text-2xl font-semibold">{name}</h1>
					<p className="text-sm text-muted-foreground">
						@{profile.username}
						{profile.membershipLevel && <> · {profile.membershipLevel}</>}
					</p>
					{profile.bio && <p className="mt-1 text-sm">{profile.bio}</p>}
				</div>
				<div className="flex gap-2">
					<Button asChild variant="outline" size="sm">
						<Link href={`/profile/${profile.username}`}>{t('account.publicProfile')}</Link>
					</Button>
					<EditProfileSheet
						initialDisplayName={profile.displayName ?? ''}
						initialBio={profile.bio ?? ''}
					/>
				</div>
			</header>

			<section aria-label={t('account.stats')} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Stat label={t('account.votesCast')} value={insights.votesCast} />
				<Stat label={t('account.pollsCreated')} value={insights.pollsCreated} />
				<Stat label={t('account.peopleReached')} value={insights.peopleReached} />
				<Stat
					label={t('account.majorityRate')}
					value={insights.majorityRate === null ? '—' : `${insights.majorityRate}%`}
					hint={t('account.majorityHint')}
				/>
			</section>

			<section aria-labelledby="badges-title" className="space-y-3">
				<h2 id="badges-title" className="text-sm font-semibold">
					{t('account.badges')}
				</h2>
				<ul className="flex flex-wrap gap-2">
					{insights.badges.map(({ id, earned }) => (
						<li
							key={id}
							title={t(`account.badge.${id}.hint`)}
							className={cn(
								'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs',
								earned ? 'border-primary/30 bg-primary/5' : 'border-dashed border-border text-muted-foreground opacity-60'
							)}
						>
							<span aria-hidden className={cn(!earned && 'grayscale')}>
								{BADGE_ICONS[id]}
							</span>
							<span className="font-medium">{t(`account.badge.${id}.name`)}</span>
							<span className="sr-only">
								{earned ? t('account.earned') : t('account.locked')}: {t(`account.badge.${id}.hint`)}
							</span>
						</li>
					))}
				</ul>
			</section>

			<Tabs defaultValue="activity">
				<TabsList>
					<TabsTrigger value="activity">
						{t('account.tabActivity')}
						{insights.awaitingResults > 0 && (
							<span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
								{insights.awaitingResults}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="polls">{t('account.tabPolls')}</TabsTrigger>
					<TabsTrigger value="settings">{t('account.tabSettings')}</TabsTrigger>
				</TabsList>
				<TabsContent value="activity" className="pt-4">
					<Activity history={history} />
				</TabsContent>
				<TabsContent value="polls" className="pt-4">
					<MyPolls polls={myPolls} />
				</TabsContent>
				<TabsContent value="settings" className="pt-4">
					<Settings profile={profile} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
	return (
		<div className="rounded-xl border border-border bg-card p-4" title={hint}>
			<p className="font-mono text-2xl font-semibold tabular-nums">
				{typeof value === 'number' ? value.toLocaleString() : value}
			</p>
			<p className="mt-1 text-xs text-muted-foreground">{label}</p>
		</div>
	);
}

const OUTCOME_STYLES = {
	pending: 'text-sky-600 dark:text-sky-400',
	won: 'text-emerald-600 dark:text-emerald-400',
	tied: 'text-amber-600 dark:text-amber-400',
	lost: 'text-muted-foreground',
	unknown: 'text-muted-foreground',
} as const;

function Activity({ history }: { history: BallotRecord[] }) {
	const { t } = useLanguage();
	if (history.length === 0) {
		return (
			<div className="py-10 text-center text-sm text-muted-foreground">
				<p className="mb-4">{t('account.noVotes')}</p>
				<Button asChild size="sm">
					<Link href="/">{t('account.findPolls')}</Link>
				</Button>
			</div>
		);
	}
	return (
		<ul className="space-y-2.5">
			{history.map(({ poll, choice, outcome }) => (
				<li key={poll.id}>
					<Link
						href={`/poll/${poll.id}`}
						className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
					>
						<div className="min-w-0 flex-1">
							<p className="truncate">{poll.title}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{t('account.youChose')} <strong className="font-medium text-foreground">{choice}</strong>
							</p>
						</div>
						<span className={cn('shrink-0 text-xs font-medium', OUTCOME_STYLES[outcome])}>
							{t(`account.outcome.${outcome}`)}
						</span>
					</Link>
				</li>
			))}
		</ul>
	);
}

function MyPolls({ polls }: { polls: Poll[] }) {
	const { t } = useLanguage();
	const isHydrated = useHydrated();
	if (polls.length === 0) {
		return <p className="py-10 text-center text-sm text-muted-foreground">{t('account.noPolls')}</p>;
	}
	return (
		<ul className="space-y-2.5">
			{polls.map((poll) => (
				<li key={poll.id}>
					<Link
						href={`/poll/${poll.id}`}
						className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
					>
						<div className="min-w-0 flex-1">
							<p className="truncate">{poll.title}</p>
							<p className="mt-1 text-xs tabular-nums text-muted-foreground">
								{t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() })}
							</p>
						</div>
						{isHydrated && <StatusChip status={derivePollStatus(poll)} poll={poll} />}
					</Link>
				</li>
			))}
		</ul>
	);
}

function Settings({ profile }: { profile: MyProfile }) {
	const { t } = useLanguage();
	const [visibility, setVisibility] = useState(profile.visibilitySettings ?? {});

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
				<ul className="divide-y divide-border rounded-xl border border-border">
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

			<section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
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
		toast.error(result.message);
	};

	return (
		<section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 p-4">
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
							onClick={(event) => {
								event.preventDefault();
								remove();
							}}
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
