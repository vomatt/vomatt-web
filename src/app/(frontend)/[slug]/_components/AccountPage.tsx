'use client';

import Link from 'next/link';

import { buttonVariants } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Insights } from '@/features/account/insights';
import { isFieldPublic, VISIBILITY_FIELDS } from '@/features/account/visibility';
import { GroupsPanel } from '@/features/groups/GroupsPanel';
import type { Poll } from '@/features/polls/schema';
import type { CursorPage } from '@/lib/api/cursor';
import { toPayloadLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';
import type { MyProfile, UserProfile } from '@/types/user';

import EditProfileDialog from './EditProfileDialog';
import ProfileHeader from './ProfileHeader';
import ProfilePollList from './ProfilePollList';
import { FollowListButtons, RelationActions } from './RelationActions';

/** `polls` and `insights` are null when the polls couldn't load. */
type OwnView = {
	isOwn: true;
	profile: MyProfile;
	polls: CursorPage<Poll> | null;
	insights: Insights | null;
};

type PublicView = {
	isOwn: false;
	profile: UserProfile;
	polls: CursorPage<Poll> | null;
	isAuthenticated: boolean;
};

/**
 * The owner sees the page visitors see, plus their insights, Groups and a
 * link to Settings. Their poll lists live in My Polls, which the counts link to.
 */
export type AccountPageProps = OwnView | PublicView;

export default function AccountPage(props: AccountPageProps) {
	const { t } = useLanguage();
	const { profile } = props;
	const visibility: Record<string, boolean> = props.isOwn ? (props.profile.visibilitySettings ?? {}) : {};

	// Hidden fields that have a value; the owner's header shows them dimmed and marked
	const hiddenFields = props.isOwn
		? VISIBILITY_FIELDS.filter((field) => !isFieldPublic(visibility, field) && profile[field] != null && profile[field] !== '')
		: [];

	// The owner's counts open My Polls, where the lists behind them live
	const myPollsHref = props.isOwn ? '/my-polls' : undefined;

	return (
		<div className="px-contain mx-auto max-w-3xl space-y-8 py-6 md:py-10">
			<ProfileHeader
				profile={profile}
				isOwn={props.isOwn}
				hiddenFields={hiddenFields}
				action={
					props.isOwn ? (
						// Equal halves on phones, where they span the column
						<div className="flex gap-2 *:flex-1 md:*:flex-none">
							<EditProfileDialog
								initialUsername={profile.username}
								initialDisplayName={profile.displayName ?? ''}
								initialBio={profile.bio ?? ''}
								initialFirstName={props.profile.firstName ?? ''}
								initialLastName={props.profile.lastName ?? ''}
								initialBirthday={props.profile.birthday ?? ''}
							/>
							<Link href="/settings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
								{t('navigation.settings')}
							</Link>
							<FollowListButtons username={profile.username} />
						</div>
					) : (
						<div className="flex flex-wrap items-center gap-4">
							{props.isAuthenticated && (
								<>
									<FollowListButtons username={profile.username} />
									<RelationActions profile={props.profile} />
								</>
							)}
						</div>
					)
				}
				stats={
					<ul className="grid auto-cols-fr grid-flow-col divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card">
						<Stat value={profile.totalVotes} label={t('profile.statVoted')} href={myPollsHref} />
						<Stat value={profile.totalPolls} label={t('profile.statCreated')} href={myPollsHref} />
						{props.isOwn && props.insights && (
							<Stat value={props.insights.turnout} label={t('profile.statTurnout')} />
						)}
					</ul>
				}
			/>

			{props.isOwn ? (
				<Tabs defaultValue="polls" className="gap-6">
					<TabsList variant="line" sticky>
						<TabsTrigger value="polls">{t('profile.polls')}</TabsTrigger>
						<TabsTrigger value="groups">{t('account.tabGroups')}</TabsTrigger>
						<TabsIndicator />
					</TabsList>
					<TabsContent value="polls">
						<ProfilePollList username={profile.username} initialPage={props.polls} isOwn />
					</TabsContent>
					{/* Kept mounted so switching tabs doesn't refetch the groups or drop a half-typed name */}
					<TabsContent value="groups" keepMounted>
						<GroupsPanel />
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

/** One cell of the counts card: the number over its label; a link when it opens My Polls. */
function Stat({ value, label, href }: { value: number; label: string; href?: string }) {
	const { currentLanguage } = useLanguage();
	const content = (
		<>
			<span className="block font-mono text-xl tabular-nums text-foreground">
				{value.toLocaleString(toPayloadLocale(currentLanguage))}
			</span>
			<span className="block text-[12px] leading-tight text-muted-foreground">{label}</span>
		</>
	);
	const cell = 'flex h-full flex-col justify-center gap-0.5 px-3 py-3 text-center';
	return (
		<li>
			{href ? (
				<Link
					href={href}
					className={cn(
						cell,
						'outline-none transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring'
					)}
				>
					{content}
				</Link>
			) : (
				<div className={cell}>{content}</div>
			)}
		</li>
	);
}
