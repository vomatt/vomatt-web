export interface PollCreateOption {
	id: string;
	text: string;
}

export type PollPrivacyMode = 'public' | 'link-only' | 'invite-only';

export interface PollCreatorData {
	question: string;
	description?: string;
	options: PollCreateOption[];
	startTime: string;
	endTime?: string;
	isAllowMultipleChoices: boolean;
	isAnonymous: boolean;
	privacyMode: PollPrivacyMode;
	invitedUsers?: string[];
}

export type PollOption = {
	id: string;
	text: string;
	votes: number;
	[key: string]: any; // optional, for extra fields if needed
};

export type Poll = {
	id: string;
	title: string;
	description: string;
	active: boolean;
	votingActive: boolean;
	allowMultipleChoices: boolean;
	anonymous: boolean;
	creatorId: string;
	creatorUsername: string;
	createdAt: string; // ISO timestamp
	updatedAt: string; // ISO timestamp
	startTime: string;
	endTime: string | null;
	totalVotes: number;
	success: boolean;
	errorCode: string | null;
	options: PollOption[];
	comments?: Comment[];
	privacyMode?: PollPrivacyMode;
};

interface Comment {
	id: string;
	author: string;
	text: string;
	createdAt: string;
}
