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
import { countText } from '@/lib/count';
import type { MyProfile, UserProfile } from '@/types/user';

import EditProfileDialog from './EditProfileDialog';
import ProfileHeader, { FollowControls, keepWhole } from './ProfileHeader';
import ProfilePollList from './ProfilePollList';

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
	const { t, currentLanguage } = useLanguage();
	const { profile } = props;
	const count = (key: string, value: number) => countText(t, key, value, currentLanguage);
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
						<div className="flex gap-2">
							<EditProfileDialog
								initialUsername={profile.username}
								initialDisplayName={profile.displayName ?? ''}
								initialBio={profile.bio ?? ''}
								initialFirstName={props.profile.firstName ?? ''}
								initialLastName={props.profile.lastName ?? ''}
								initialBirthday={profile.birthday ?? ''}
							/>
							<Link href="/settings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
								{t('navigation.settings')}
							</Link>
						</div>
					) : (
						<FollowControls profile={props.profile} isAuthenticated={props.isAuthenticated} />
					)
				}
				meta={
					<>
						<Count text={count('account.votesCast', profile.totalVotes)} href={myPollsHref} />
						<Count text={count('account.pollsCreated', profile.totalPolls)} href={myPollsHref} />
						{props.isOwn && props.insights && (
							<Count text={count('account.turnout', props.insights.turnout)} />
						)}
					</>
				}
			/>

			{props.isOwn ? (
				<Tabs defaultValue="polls" className="gap-6">
					<TabsList variant="line">
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

/** One count in the header's details row, kept whole unless it's wider than the column; a link when it opens My Polls. */
function Count({ text, href }: { text: string; href?: string }) {
	if (!href) return <span className="wrap-anywhere">{keepWhole(text)}</span>;
	return (
		<Link
			href={href}
			className="wrap-anywhere rounded-sm underline underline-offset-3 transition-colors hover:text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
		>
			{keepWhole(text)}
		</Link>
	);
}
