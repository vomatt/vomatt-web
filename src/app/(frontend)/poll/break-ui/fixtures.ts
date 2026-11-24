// Dev-only fixtures for /poll/break-ui: the demo data the UI was designed against, and the
// worst realistic data the API accepts (limits from api-docs.json: title 200, description 1000,
// option 200, comment 2000, username 50, first/last name 50, display name 100, bio 500).
import type { Comment, Poll, ThreadComment } from '@/features/polls/schema';
import type { MyProfile, UserProfile } from '@/types/user';

export const DATA_STATES = ['demo', 'worst', 'empty', 'one', 'huge'] as const;
export type DataState = (typeof DATA_STATES)[number];

export const VIEWER_ID = '00000000-0000-4000-8000-000000000001';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();
const uuid = (n: number) => `9f8e7d6c-5b4a-4c3d-8e2f-${n.toString(16).padStart(12, '0')}`;

// Usernames are [a-z0-9_] up to 50
const LONG_USER = 'bartholomew_fitzgerald_northwind_industries_2024hq'; // 50
const LONG_USER_2 = 'konstantin_oberhauser_wettstein_photography_studio'; // 50
const ME_LONG = 'aleksandra_wisniewska_kowalczyk_design_engineering'; // 50

const LONG_URL =
	'https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments&filter=unresolved&sort=newest';

type PollSeed = Partial<Poll> & Pick<Poll, 'title' | 'options'>;

function poll(n: number, seed: PollSeed, ended = false): Poll {
	return {
		id: uuid(n),
		description: null,
		active: true,
		votingActive: !ended,
		voterVisibility: 'signed-in',
		creatorId: uuid(900 + n),
		creatorUsername: 'janedoe',
		creatorAvatarUrl: null,
		createdAt: iso(-2 * HOUR),
		startTime: iso(-2 * HOUR),
		endTime: ended ? iso(-1 * HOUR) : iso(3 * DAY),
		audience: 'public',
		totalVotes: 12,
		participantCount: 12,
		commentCount: 4,
		shareCount: 2,
		likeCount: 8,
		likedByMe: false,
		bookmarked: false,
		myOptionId: null,
		tags: [],
		...seed,
	};
}

const opts = (texts: string[], votes?: number[]) =>
	texts.map((text, i) => ({ id: uuid(5000 + i + texts.length * 100), text, votes: votes?.[i] }));

// ——— Polls ———

const demoPolls: Poll[] = [
	poll(1, {
		title: 'Where should we go for the team lunch?',
		description: 'Friday at noon.',
		options: opts(['Ramen', 'Tacos', 'Salad bar']),
	}),
	poll(
		2,
		{
			title: 'Best coffee in town?',
			options: opts(['Café Luna', 'Brew Lab'], [7, 5]),
		},
		true
	),
];

const worstDescription = [
	'Context for anyone joining late: the board asked every department to weigh in before the Q3 budget review, and the results of this poll go straight into the deck on Thursday.',
	'',
	'Background reading (please read before voting, it is long but it matters): ' + LONG_URL,
	'',
	'A few ground rules:',
	'• One vote per person, obviously.',
	'• If none of the options fit, comment below instead of picking the closest one.',
	'• Anonymous ballots are fine; nobody will see who picked what until it ends.',
	'',
	'Kommentare auf Deutsch sind auch willkommen — Mitarbeiterzufriedenheitsumfrageergebnisse werden übersetzt. 中文留言也可以，我們會翻譯。Đặng Thị Ngọc Hân will collect the Vietnamese ones. Thanks all, and sorry for the wall of text!!',
]
	.join('\n')
	.slice(0, 1000);

const worstPolls: Poll[] = [
	poll(10, {
		// 200 characters
		title:
			'Should the Q3 offsite move from Lisbon to Kraków given the revised budget, the visa timelines for the Taipei team, and the fact that half of engineering already booked non-refundable flights in March?',
		description: worstDescription,
		creatorUsername: LONG_USER,
		creatorAvatarUrl: '/api/avatars/deleted-photo-2f9a.jpg', // uploaded photo that now 404s
		participantCount: 1_284_567,
		totalVotes: 1_284_567,
		commentCount: 12_480,
		likeCount: 1_000_000,
		shareCount: 1,
		likedByMe: true,
		bookmarked: true,
		audience: 'invite-only',
		inviteeCount: 1284,
		createdAt: iso(-3 * 365 * DAY),
		startTime: iso(-3 * 365 * DAY),
		endTime: iso(45 * 60_000),
		options: opts([
			'Keep Lisbon: flights are booked, the venue deposit (€12,345.67) is non-refundable, and moving now costs more than we would save on hotels in Kraków even after the exchange rate changes',
			'Kraków',
			LONG_URL,
			'Mitarbeiterzufriedenheitsumfrageergebnisbesprechungsraum',
			'在台北辦，因為簽證時間來不及，而且一半的工程師已經在三月訂了不能退的機票，所以搬到克拉科夫反而更貴',
			'نقل الاجتماع إلى كراكوف بسبب الميزانية الجديدة',
			'👩🏽‍💻 Remote only',
			'Y',
			'<script>alert(1)</script> &amp; **bold**',
			'Postpone until Q4 and revisit once the revised budget is approved by finance, legal, and the regional leads in all three offices',
		]),
	}),
	poll(
		11,
		{
			title:
				'Mitarbeiterzufriedenheitsumfrageergebnispräsentationsvorbereitungsbesprechungstermin — which slot works?',
			creatorUsername: 'jo',
			creatorDisplayName: 'Jo',
			participantCount: 1,
			totalVotes: 1,
			commentCount: 1,
			likeCount: 1,
			myOptionId: uuid(5000 + 1 + 300),
			endTime: iso(-12 * DAY),
			deadline: iso(-5 * DAY),
			options: opts(
				[
					'Monday 09:00 (Europe/Warsaw)',
					'Tuesday',
					'Wednesday afternoon, but only if the Taipei team can join remotely without staying up past midnight',
				],
				[0, 1, 0]
			),
		},
		true
	),
	poll(12, {
		title: '午餐吃什麼？台北辦公室附近的新餐廳開幕了，大家想去試試看嗎？還是照舊去樓下那家便當店？投票截止時間是明天中午十二點整，請大家盡快投票，謝謝！',
		creatorUsername: LONG_USER_2,
		participantCount: 0,
		totalVotes: 0,
		commentCount: 0,
		likeCount: 0,
		shareCount: 0,
		options: opts(['便當', '拉麵']),
	}),
	poll(
		13,
		{
			title: '?',
			creatorUsername: 'j_o',
			participantCount: 0,
			totalVotes: 0,
			commentCount: 0,
			likeCount: 0,
			options: opts(['Yes', 'No'], [0, 0]),
		},
		true
	),
	poll(14, {
		title: 'هل نغيّر موعد الاجتماع الأسبوعي إلى يوم الأحد بدلاً من الاثنين؟',
		description: 'نرجو التصويت قبل نهاية الأسبوع. Thanks!',
		creatorUsername: 'nour_alhuda',
		options: opts(['نعم', 'لا', 'Doesn’t matter to me']),
	}),
];

// ——— Comments ———

type Seed = Partial<ThreadComment> & Pick<ThreadComment, 'author' | 'text'>;
function comment(n: number, seed: Seed): ThreadComment {
	return {
		id: uuid(7000 + n),
		voteId: uuid(10),
		userId: uuid(800 + n),
		authorAvatarUrl: null,
		createdAt: iso(-n * 37 * 60_000),
		likeCount: 0,
		likedByCurrentUser: false,
		replyCount: 0,
		...seed,
	};
}
const reply = (n: number, parent: number, seed: Seed): Comment => ({
	...comment(n, seed),
	parentId: uuid(7000 + parent),
});

const demoComments: ThreadComment[] = [
	comment(1, { author: 'janedoe', text: 'Ramen every time.', likeCount: 3 }),
	comment(2, {
		author: 'sam',
		text: 'Tacos! The new place on Main St is great.',
		replyCount: 1,
		replies: [reply(3, 2, { author: 'janedoe', text: 'Agreed 🌮' })],
	}),
];

const longPaste = `Okay, long one, sorry. I went through last year's numbers again and I think we're comparing the wrong things.

1) Flights: the March bookings were made under the old travel policy, so about 40% are actually refundable as credit — finance confirmed this on Tuesday.
2) Venue: the Lisbon deposit is €12,345.67 but the contract has a force-majeure-ish clause about "material budget changes" (section 7.2(b)), which might apply here.
3) Visas: the Taipei team needs ~6 weeks for Schengen either way, so Lisbon vs Kraków makes no difference there.

So the real question isn't Lisbon vs Kraków, it's whether we can renegotiate the deposit. I'd rather we postpone the vote until legal reads 7.2(b). Full spreadsheet: ${LONG_URL}

@${LONG_USER_2} you had the contract, can you check?`;

const worstComments: ThreadComment[] = [
	comment(1, {
		author: LONG_USER,
		authorAvatarUrl: '/api/avatars/deleted-photo-2f9a.jpg',
		text: longPaste,
		likeCount: 1284,
		edited: true,
		mentions: [{ userId: uuid(802), username: LONG_USER_2 }],
		replyCount: 47,
		repliesNextCursor: 'c1',
		replies: [
			reply(20, 1, {
				author: LONG_USER_2,
				text: `@${LONG_USER} checked, 7.2(b) doesn't apply 😞`,
				likeCount: 1,
			}),
			reply(21, 1, {
				author: ME_LONG,
				userId: VIEWER_ID,
				text: `@${LONG_USER_2} ${LONG_URL}`,
				likeCount: 0,
			}),
		],
	}),
	comment(2, { author: 'jo', text: 'k', likeCount: 1 }),
	comment(3, {
		author: null,
		text: null,
		deleted: true,
		userId: null,
		replyCount: 1,
		replies: [reply(22, 3, { author: 'ola_olafsson', text: 'What did they say? It’s gone now.' })],
	}),
	comment(4, {
		author: 'dang_thi_ngoc_han',
		text: 'Đặng Thị Ngọc Hân đây — tôi đồng ý với ý kiến trên. 我也同意，克拉科夫比較便宜。',
		createdAt: iso(5 * 60_000), // the server's clock is ahead of the viewer's
	}),
	comment(5, {
		author: 'nour_alhuda',
		text: 'أنا أفضّل لشبونة، الرحلات محجوزة بالفعل. Lisbon pls.',
		likeCount: 12_480,
	}),
	comment(6, {
		author: ME_LONG,
		userId: VIEWER_ID,
		text: 'Mitarbeiterzufriedenheitsumfrageergebnisbesprechungsraumreservierungsbestätigung',
		createdAt: iso(-3 * 365 * DAY),
		edited: true,
	}),
	comment(7, { author: 'sam', text: '<script>alert(1)</script> &amp; **not bold**\n\n\n\n\nfive blank lines above' }),
];

// ——— Profiles ———

const baseProfile: UserProfile = {
	id: uuid(901),
	username: 'janedoe',
	displayName: 'Jane',
	firstName: 'Jane',
	lastName: 'Doe',
	bio: 'Product designer. I ask about lunch a lot.',
	joinedAt: '2024-03-12T09:00:00Z',
	totalPolls: 12,
	totalVotes: 48,
	avatarUrl: null,
	followersCount: 42,
	followingCount: 37,
	isFollowing: false,
	followsYou: true,
	isBlocked: false,
	mutualFollowersCount: 2,
	mutualFollowersPreview: [
		{ id: uuid(950), username: 'sam', displayName: 'Sam Lee' },
		{ id: uuid(951), username: 'alex', displayName: 'Alex Kim' },
	],
	community: false,
	gender: null,
};

const worstProfile: UserProfile = {
	...baseProfile,
	username: LONG_USER,
	// 50 + 50 + 100, the API's limits; the display name differs from the real name, so both show
	firstName: 'Christopher Alexander Bartholomew Fitzgerald-Montg',
	lastName: 'Wiśniewska-Kowalczyk-Oberhauser-Wettstein III, PhD',
	displayName: '🦊 Bart from Northwind Industries Holdings (he/him) — ask me about the Q3 offsite, not about invoices'.slice(0, 100),
	// 500
	bio: `Senior Product Design Engineer, Platform Infrastructure @ Northwind Industries Holdings.
Previously: Kraków → Lisbon → Taipei.
Portfolio: ${LONG_URL}
I run the Thursday polls. If you want something on the agenda, comment on the latest one or DM me. Opinions are my own and also my cat's. 🐈‍⬛
中文、Deutsch, Polski OK.
—
Not active on weekends!!!`.slice(0, 500),
	avatarUrl: '/api/avatars/deleted-photo-2f9a.jpg',
	followersCount: 1_284_567,
	followingCount: 1,
	gender: 'UNDISCLOSED',
	joinedAt: '2019-01-01T00:00:00Z',
	totalPolls: 1284,
	totalVotes: 12_480,
	mutualFollowersCount: 1284,
	mutualFollowersPreview: [
		{ id: uuid(952), username: LONG_USER_2, displayName: 'Konstantin Oberhauser-Wettstein' },
		{ id: uuid(953), username: 'j', displayName: null },
		{ id: uuid(954), username: ME_LONG, displayName: 'Aleksandra Wiśniewska-Kowalczyk' },
	],
};

const emptyProfile: UserProfile = {
	...baseProfile,
	username: 'jo',
	displayName: null,
	firstName: null,
	lastName: null,
	bio: null,
	totalPolls: 0,
	totalVotes: 0,
	followersCount: 0,
	followingCount: 0,
	followsYou: false,
	mutualFollowersCount: 0,
	mutualFollowersPreview: [],
	joinedAt: iso(-60_000),
};

const oneProfile: UserProfile = {
	...emptyProfile,
	username: 'j_o',
	displayName: 'J',
	totalPolls: 1,
	totalVotes: 1,
	followersCount: 1,
	followingCount: 1,
	mutualFollowersCount: 1,
	mutualFollowersPreview: [{ id: uuid(955), username: 'sam', displayName: 'Sam' }],
};

function toMine(profile: UserProfile, polls: Poll[]): MyProfile {
	return {
		id: VIEWER_ID,
		username: profile.username,
		email: profile.username === LONG_USER ? 'bartholomew.fitzgerald@northwind-industries-holdings.example.com' : 'jane@example.com',
		phoneNumber: null,
		firstName: profile.firstName ?? null,
		lastName: profile.lastName ?? null,
		birthday: null,
		displayName: profile.displayName,
		bio: profile.bio,
		location: null,
		gender: profile.gender ?? null,
		active: true,
		lastLoginAt: iso(-HOUR),
		joinedAt: profile.joinedAt,
		totalPolls: profile.totalPolls,
		totalVotes: profile.totalVotes,
		createdPollCount: polls.filter((p) => p.creatorId === VIEWER_ID).length,
		votedPollCount: polls.filter((p) => p.myOptionId).length,
		followersCount: profile.followersCount,
		followingCount: profile.followingCount,
		visibilitySettings: {},
		anonymousBallotByDefault: false,
		avatarUrl: profile.avatarUrl,
		plan: 'FREE',
	};
}

/** The viewer's own polls: same fixtures, created by the viewer. */
const asMine = (polls: Poll[]) =>
	polls.map((p) => ({ ...p, creatorId: VIEWER_ID, deletable: true }));

function many<T>(seed: T[], count: number, at: (item: T, i: number) => T) {
	return Array.from({ length: count }, (_, i) => at(seed[i % seed.length], i));
}

export type Fixture = {
	polls: Poll[];
	comments: ThreadComment[];
	commentTotal: number;
	profile: UserProfile;
	viewer: { username: string; avatarUrl: string | null };
};

export function getFixture(state: DataState): Fixture & { mine: MyProfile; myPolls: Poll[] } {
	const base = build(state);
	const myPolls = asMine(base.polls);
	return { ...base, mine: toMine(base.profile, myPolls), myPolls };
}

function build(state: DataState): Fixture {
	switch (state) {
		case 'demo':
			return {
				polls: demoPolls,
				comments: demoComments,
				commentTotal: 3,
				profile: baseProfile,
				viewer: { username: 'janedoe', avatarUrl: null },
			};
		case 'worst':
			return {
				polls: worstPolls,
				comments: worstComments,
				commentTotal: 12_480,
				profile: worstProfile,
				viewer: { username: ME_LONG, avatarUrl: null },
			};
		case 'empty':
			return {
				polls: [],
				comments: [],
				commentTotal: 0,
				profile: emptyProfile,
				viewer: { username: 'jo', avatarUrl: null },
			};
		case 'one':
			return {
				polls: [
					poll(30, {
						title: 'One?',
						participantCount: 1,
						totalVotes: 1,
						commentCount: 1,
						likeCount: 1,
						shareCount: 1,
						options: opts(['A', 'B']),
					}),
				],
				comments: [
					comment(30, {
						author: 'sam',
						text: 'One comment.',
						likeCount: 1,
						replyCount: 1,
						replies: [reply(31, 30, { author: 'jo', text: 'One reply.', likeCount: 1 })],
					}),
				],
				commentTotal: 2,
				profile: oneProfile,
				viewer: { username: 'j_o', avatarUrl: null },
			};
		case 'huge':
			return {
				polls: many(worstPolls, 400, (p, i) => ({ ...p, id: uuid(20_000 + i) })),
				comments: many(worstComments, 600, (c, i) => ({
					...c,
					id: uuid(30_000 + i),
					replies: c.replies?.map((r, j) => ({ ...r, id: uuid(60_000 + i * 10 + j), parentId: uuid(30_000 + i) })),
				})),
				commentTotal: 12_480,
				profile: worstProfile,
				viewer: { username: ME_LONG, avatarUrl: null },
			};
	}
}
